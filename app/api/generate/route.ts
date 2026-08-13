import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { DESIGN_STYLES } from "@/lib/constants/designStyles";
import Replicate from "replicate";

export const maxDuration = 60; // Allow sufficient timeout for AI rendering

export async function POST(req: NextRequest) {
  const supabaseServer = createServerSupabaseClient();
  const adminSupabase = createAdminClient();

  // 1. Authenticate user via Supabase Server Client (with guest demo fallback)
  const {
    data: { user },
  } = await supabaseServer.auth.getUser();

  // 2. Parse request payload
  let payload: {
    imageUrl: string;
    roomType: string;
    designStyle: string;
    customPrompt?: string;
    projectId?: string;
  };

  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON request payload." }, { status: 400 });
  }

  const { imageUrl, roomType, designStyle, customPrompt, projectId } = payload;

  if (!imageUrl || !roomType || !designStyle) {
    return NextResponse.json(
      { error: "Missing required parameters: imageUrl, roomType, and designStyle are mandatory." },
      { status: 400 }
    );
  }

  let creditDeducted = false;
  let remainingCredits = 5;
  let originalCredits = 5;
  let userId = user?.id || "guest";

  // 3. If user is authenticated, verify and deduct real credits in Supabase
  if (user) {
    const { data: userRecord } = await adminSupabase
      .from("users")
      .select("credits, subscription_tier")
      .eq("id", user.id)
      .single();

    if (userRecord) {
      originalCredits = userRecord.credits;
      if (userRecord.credits <= 0) {
        return NextResponse.json(
          {
            error: "Insufficient credits. Please upgrade your subscription plan to continue redesigning rooms.",
            requiresUpgrade: true,
            credits: userRecord.credits,
          },
          { status: 403 }
        );
      }

      // Deduct 1 credit immediately
      const { data: updatedUser } = await adminSupabase
        .from("users")
        .update({
          credits: userRecord.credits - 1,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)
        .select("credits")
        .single();

      creditDeducted = true;
      remainingCredits = updatedUser?.credits ?? userRecord.credits - 1;
    }
  }

  try {
    // 4. Formulate positive and negative prompts
    const positivePrompt = `Professional architectural photography of a stunning ${designStyle} style ${roomType}, masterclass interior design, architectural digest magazine quality, 8k resolution, raytracing photorealistic lighting, cohesive color harmony, premium textures and designer furniture${
      customPrompt ? `, ${customPrompt}` : ""
    }`;

    const negativePrompt =
      "ugly, deformed, noisy, blurry, watermark, cartoon, sketch, low quality, distortion, bad proportions, cluttered junk, oversaturated, unrealistic lighting, duplicate furniture, artifacts";

    let generatedRemoteUrl: string = "";
    let aiEngineUsed = "Free Open-Source FLUX AI Engine";

    // 5. Attempt Replicate ControlNet if valid token is provided
    const replicateToken = process.env.REPLICATE_API_TOKEN;
    const isReplicateConfigured =
      replicateToken &&
      !replicateToken.includes("placeholder") &&
      !replicateToken.startsWith("r8_your_");

    if (isReplicateConfigured) {
      try {
        const replicate = new Replicate({
          auth: replicateToken,
        });

        // Run the official adirik/interior-design ControlNet image-to-image pipeline
        const output: any = await replicate.run(
          "adirik/interior-design:76604baddc85b1b4616e1c6475eca080da339c8875bd4996705440484a6eac38",
          {
            input: {
              image: imageUrl,
              prompt: positivePrompt,
              negative_prompt: negativePrompt,
              prompt_strength: 0.75,
              guidance_scale: 15,
              num_inference_steps: 30,
            },
          }
        );

        if (Array.isArray(output) && output.length > 0) {
          generatedRemoteUrl = String(output[0]);
          aiEngineUsed = "Replicate ControlNet SDXL";
        } else if (typeof output === "string") {
          generatedRemoteUrl = output;
          aiEngineUsed = "Replicate ControlNet SDXL";
        } else if (output && typeof output === "object" && output.url) {
          generatedRemoteUrl = String(output.url());
          aiEngineUsed = "Replicate ControlNet SDXL";
        }
      } catch (replicateErr: any) {
        console.warn(
          "Replicate GPU failed (insufficient credit or rate limit), falling back to 100% Free FLUX AI Engine:",
          replicateErr.message
        );
      }
    }

    // 6. Free Tier: If Replicate is not funded or unconfigured, generate with 100% Free FLUX AI Engine ($0 cost, no API key required)
    if (!generatedRemoteUrl) {
      const seed = Math.floor(Math.random() * 10000000);
      const encodedPrompt = encodeURIComponent(
        `Professional architectural interior photography, ${designStyle} style ${roomType}, ${customPrompt || "luxurious interior design"}, 8k uhd, architectural digest magazine photograph, raytraced lighting, ultra-detailed interior finishes, mastercraft furniture`
      );

      generatedRemoteUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&seed=${seed}&model=flux&nologo=true`;
      aiEngineUsed = "Free FLUX Neural Engine ($0 Cost)";
    }

    // 7. Download the generated image and save permanently into Supabase Storage
    let permanentStorageUrl = generatedRemoteUrl;

    try {
      const imageResponse = await fetch(generatedRemoteUrl);
      if (imageResponse.ok) {
        const imageBlob = await imageResponse.arrayBuffer();
        const buffer = Buffer.from(imageBlob);
        const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;

        const { error: uploadError } = await adminSupabase.storage
          .from("home_designs")
          .upload(fileName, buffer, {
            contentType: "image/jpeg",
            upsert: true,
          });

        if (!uploadError) {
          const { data: publicUrlData } = adminSupabase.storage
            .from("home_designs")
            .getPublicUrl(fileName);

          if (publicUrlData?.publicUrl) {
            permanentStorageUrl = publicUrlData.publicUrl;
          }
        } else {
          console.warn("Storage upload notice, retaining direct URL:", uploadError.message);
        }
      }
    } catch (storageErr) {
      console.warn("Error persisting image to Supabase storage, using direct URL:", storageErr);
    }

    // 7. Insert record into generations database table if user is logged in
    let generationRecord = {
      id: `gen-${Date.now()}`,
      user_id: userId,
      project_id: projectId || null,
      original_image_url: imageUrl,
      generated_image_url: permanentStorageUrl,
      style_prompt: positivePrompt,
      room_type: roomType,
      metadata: {
        model: "rocketdigitalai/interior-design-sdxl-lightning",
        guidance_scale: 7.0,
        num_inference_steps: 6,
        designStyle,
        customPrompt: customPrompt || "",
        generatedAt: new Date().toISOString(),
      },
      created_at: new Date().toISOString(),
    };

    if (user) {
      const { data: dbGenRecord, error: insertError } = await adminSupabase
        .from("generations")
        .insert({
          user_id: user.id,
          project_id: projectId || null,
          original_image_url: imageUrl,
          generated_image_url: permanentStorageUrl,
          style_prompt: positivePrompt,
          room_type: roomType,
          metadata: {
            model: "rocketdigitalai/interior-design-sdxl-lightning",
            guidance_scale: 7.0,
            num_inference_steps: 6,
            designStyle,
            customPrompt: customPrompt || "",
            generatedAt: new Date().toISOString(),
          },
        })
        .select()
        .single();

      if (!insertError && dbGenRecord) {
        generationRecord = dbGenRecord;
      }
    }

    // 8. Return successful response with remaining credits and generation record
    return NextResponse.json({
      success: true,
      generation: generationRecord,
      remainingCredits: remainingCredits,
    });
  } catch (error: any) {
    console.error("Critical error during AI generation pipeline:", error);

    // 9. Catch block: Securely refund the user's deducted credit
    if (creditDeducted && user) {
      try {
        await adminSupabase
          .from("users")
          .update({
            credits: originalCredits,
            updated_at: new Date().toISOString(),
          })
          .eq("id", user.id);
        console.log(`Credit successfully refunded to user ${user.id}`);
      } catch (refundError) {
        console.error("Critical: Failed to refund user credit after generation failure:", refundError);
      }
    }

    return NextResponse.json(
      {
        error: error.message || "Failed to generate interior design. Your credit has been refunded.",
        refunded: true,
      },
      { status: 500 }
    );
  }
}
