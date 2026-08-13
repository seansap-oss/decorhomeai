export type SubscriptionTier = "free" | "starter" | "pro" | "enterprise";

export interface UserProfile {
  id: string;
  email: string;
  credits: number;
  subscription_tier: SubscriptionTier;
  stripe_customer_id?: string | null;
  razorpay_customer_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface Generation {
  id: string;
  project_id?: string | null;
  user_id: string;
  original_image_url: string;
  generated_image_url: string;
  style_prompt: string;
  room_type: string;
  metadata?: {
    model?: string;
    guidance_scale?: number;
    num_inference_steps?: number;
    cost_breakdown?: CostItem[];
    [key: string]: any;
  } | null;
  created_at: string;
}

export interface SubscriptionRecord {
  id: string;
  user_id: string;
  gateway: "stripe" | "razorpay";
  subscription_id: string;
  plan_tier: SubscriptionTier;
  status: "active" | "canceled" | "past_due" | "trialing";
  current_period_start: string | null;
  current_period_end: string | null;
  created_at: string;
  updated_at: string;
}

export interface PricingPlan {
  id: SubscriptionTier;
  name: string;
  priceUSD: number;
  priceINR: number;
  credits: number;
  description: string;
  features: string[];
  popular?: boolean;
  stripePriceId?: string;
}

export interface CostItem {
  id: string;
  category: "Flooring" | "Furniture" | "Wall Finishes" | "Lighting" | "Decor & Accessories" | "Labor & Installation";
  name: string;
  description: string;
  estimatedCostUSD: number;
  estimatedCostINR: number;
  quantity: number;
  unit: string;
}

export interface RoomTypeOption {
  id: string;
  label: string;
  icon: string;
  description: string;
}

export interface DesignStyleOption {
  id: string;
  name: string;
  description: string;
  promptKeyword: string;
  imageUrl: string;
  tag: string;
}
