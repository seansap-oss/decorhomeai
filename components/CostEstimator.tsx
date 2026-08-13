"use client";

import React, { useState, useMemo } from "react";
import {
  FileSpreadsheet,
  Download,
  Plus,
  Trash2,
  DollarSign,
  Calculator,
  Hammer,
  Lamp,
  Layers,
  Armchair,
  Paintbrush,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CostItem } from "@/types";
import { formatCurrency } from "@/lib/utils";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface CostEstimatorProps {
  roomType: string;
  designStyle: string;
  generatedImageUrl?: string;
  className?: string;
}

// Generate realistic initial budget items based on room type and style
const generateDefaultCostItems = (roomType: string, designStyle: string): CostItem[] => {
  return [
    {
      id: "cost-1",
      category: "Flooring",
      name: "Engineered Oak Hardwood Flooring",
      description: "Water-resistant matte UV oil finish, 250 sq ft",
      estimatedCostUSD: 1750,
      estimatedCostINR: 145000,
      quantity: 1,
      unit: "Lot (250 sqft)",
    },
    {
      id: "cost-2",
      category: "Furniture",
      name: "Custom Tailored Sectional / Accent Chairs",
      description: `High-density foam with ${designStyle} premium upholstery`,
      estimatedCostUSD: 2400,
      estimatedCostINR: 198000,
      quantity: 1,
      unit: "Set",
    },
    {
      id: "cost-3",
      category: "Furniture",
      name: "Solid Teak / Marble Coffee & Side Tables",
      description: "Handcrafted architectural centerpiece with satin sealer",
      estimatedCostUSD: 650,
      estimatedCostINR: 54000,
      quantity: 1,
      unit: "Piece",
    },
    {
      id: "cost-4",
      category: "Wall Finishes",
      name: "Artisanal Lime Plaster & Acoustic Wood Slats",
      description: "Textured breathable mineral plaster with acoustic backing",
      estimatedCostUSD: 1100,
      estimatedCostINR: 92000,
      quantity: 1,
      unit: "Feature Wall",
    },
    {
      id: "cost-5",
      category: "Lighting",
      name: "Architectural Recessed CRI 95+ & Pendant Sconces",
      description: "Dimmable warm 2700K smart LED cove and pendant fixtures",
      estimatedCostUSD: 850,
      estimatedCostINR: 70000,
      quantity: 1,
      unit: "Package",
    },
    {
      id: "cost-6",
      category: "Decor & Accessories",
      name: "Hand-Knotted Wool Rug & Botanical Planters",
      description: "Natural fibers, heavy-pile rug with mature indoor greenery",
      estimatedCostUSD: 780,
      estimatedCostINR: 64000,
      quantity: 1,
      unit: "Package",
    },
    {
      id: "cost-7",
      category: "Labor & Installation",
      name: "Master Carpentry, Electrical & Painter Labor",
      description: "Certified licensed contractors, surface prep, and cleanup",
      estimatedCostUSD: 1500,
      estimatedCostINR: 120000,
      quantity: 1,
      unit: "Contract",
    },
  ];
};

export const CostEstimator: React.FC<CostEstimatorProps> = ({
  roomType,
  designStyle,
  generatedImageUrl,
  className = "",
}) => {
  const [items, setItems] = useState<CostItem[]>(() =>
    generateDefaultCostItems(roomType, designStyle)
  );
  const [currency, setCurrency] = useState<"USD" | "INR">("USD");
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Calculate totals
  const totalCost = useMemo(() => {
    return items.reduce((sum, item) => {
      const price = currency === "USD" ? item.estimatedCostUSD : item.estimatedCostINR;
      return sum + price * item.quantity;
    }, 0);
  }, [items, currency]);

  // Remove an item
  const handleRemoveItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  // Add a custom item
  const handleAddItem = () => {
    const newItem: CostItem = {
      id: `cost-${Date.now()}`,
      category: "Decor & Accessories",
      name: "Custom Fixture / Material",
      description: "User specified interior improvement",
      estimatedCostUSD: 350,
      estimatedCostINR: 28000,
      quantity: 1,
      unit: "Piece",
    };
    setItems((prev) => [...prev, newItem]);
  };

  // Update quantity
  const handleUpdateQuantity = (id: string, qty: number) => {
    if (qty < 1) return;
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity: qty } : item))
    );
  };

  // Category Icon Resolver
  const getCategoryIcon = (category: CostItem["category"]) => {
    switch (category) {
      case "Flooring":
        return <Layers className="w-4 h-4 text-amber-400" />;
      case "Furniture":
        return <Armchair className="w-4 h-4 text-indigo-400" />;
      case "Wall Finishes":
        return <Paintbrush className="w-4 h-4 text-emerald-400" />;
      case "Lighting":
        return <Lamp className="w-4 h-4 text-yellow-400" />;
      case "Decor & Accessories":
        return <Sparkles className="w-4 h-4 text-purple-400" />;
      case "Labor & Installation":
        return <Hammer className="w-4 h-4 text-orange-400" />;
      default:
        return <DollarSign className="w-4 h-4 text-slate-400" />;
    }
  };

  // Generate and Download PDF Report using jsPDF and autoTable
  const handleDownloadPDF = async () => {
    try {
      setIsExporting(true);
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      // Header Branding
      doc.setFillColor(15, 23, 42); // Dark slate header
      doc.rect(0, 0, 210, 42, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.setTextColor(255, 255, 255);
      doc.text("DecorHome AI", 14, 18);

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(165, 180, 252);
      doc.text("Architectural & Interior Design Cost Estimation Report", 14, 25);

      doc.setFontSize(9);
      doc.setTextColor(203, 213, 225);
      doc.text(`Generated: ${new Date().toLocaleDateString("en-US", { dateStyle: "long" })}`, 14, 33);
      doc.text(`Project ID: DECOR-${Date.now().toString().slice(-6)}`, 140, 33);

      // Metadata summary section
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text("Design Project Specifications", 14, 52);

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(71, 85, 105);
      doc.text(`Room Type: ${roomType}`, 14, 59);
      doc.text(`Design Style: ${designStyle}`, 14, 65);
      doc.text(`Currency: ${currency}`, 140, 59);
      doc.text(
        `Total Estimated Budget: ${formatCurrency(totalCost, currency)}`,
        140,
        65
      );

      // Table Content
      const tableData = items.map((item, index) => {
        const unitCost = currency === "USD" ? item.estimatedCostUSD : item.estimatedCostINR;
        const total = unitCost * item.quantity;
        return [
          (index + 1).toString(),
          item.category,
          item.name + "\n" + item.description,
          item.quantity.toString() + " " + item.unit,
          formatCurrency(unitCost, currency),
          formatCurrency(total, currency),
        ];
      });

      autoTable(doc, {
        startY: 72,
        head: [["#", "Category", "Item & Specification", "Qty / Unit", "Unit Cost", "Subtotal"]],
        body: tableData,
        theme: "striped",
        headStyles: {
          fillColor: [79, 70, 229], // Indigo
          textColor: [255, 255, 255],
          fontSize: 9,
          fontStyle: "bold",
        },
        bodyStyles: {
          fontSize: 8,
          textColor: [30, 41, 59],
        },
        columnStyles: {
          0: { cellWidth: 10, halign: "center" },
          1: { cellWidth: 32 },
          2: { cellWidth: 70 },
          3: { cellWidth: 26, halign: "center" },
          4: { cellWidth: 26, halign: "right" },
          5: { cellWidth: 26, halign: "right", fontStyle: "bold" },
        },
        margin: { top: 72, left: 14, right: 14 },
      });

      const finalY = (doc as any).lastAutoTable.finalY || 200;

      // Summary Card at bottom
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(14, finalY + 8, 182, 32, 3, 3, "FD");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text("Estimated Project Total:", 20, finalY + 20);

      doc.setFontSize(14);
      doc.setTextColor(79, 70, 229);
      doc.text(formatCurrency(totalCost, currency), 20, finalY + 30);

      doc.setFontSize(8);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(100, 116, 139);
      doc.text(
        "* Estimates are AI-computed based on current regional material and contractor averages. Final quotes may vary.",
        20,
        finalY + 36
      );

      // Save PDF file
      doc.save(`DecorHome-Budget-${roomType.replace(/\s+/g, "-")}-${Date.now()}.pdf`);
    } catch (error) {
      console.error("Failed to export PDF budget:", error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className={`rounded-2xl glass-panel p-6 shadow-2xl ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-indigo-400" />
            <h3 className="text-xl font-bold text-white">AI Material & Cost Estimator</h3>
            <Badge variant="purple" className="text-[11px]">
              AI Itemized
            </Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time material, furniture & labor cost breakdown calculated for {roomType} in{" "}
            <span className="text-indigo-300 font-medium">{designStyle}</span> style.
          </p>
        </div>

        {/* Currency Switcher & PDF Download Button */}
        <div className="flex items-center gap-3">
          {/* Currency Toggle */}
          <div className="flex items-center bg-slate-800/80 rounded-lg p-0.5 border border-white/10">
            <button
              onClick={() => setCurrency("USD")}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                currency === "USD"
                  ? "bg-indigo-600 text-white shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              USD ($)
            </button>
            <button
              onClick={() => setCurrency("INR")}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                currency === "INR"
                  ? "bg-indigo-600 text-white shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              INR (₹)
            </button>
          </div>

          {/* Export PDF Button */}
          <Button
            onClick={handleDownloadPDF}
            disabled={isExporting}
            variant="gradient"
            size="sm"
            className="gap-2 h-9 text-xs"
          >
            <Download className="w-4 h-4" />
            {isExporting ? "Generating PDF..." : "Export Budget PDF"}
          </Button>
        </div>
      </div>

      {/* Itemized Table */}
      <div className="overflow-x-auto my-4">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-white/10 text-slate-400 uppercase tracking-wider font-semibold">
              <th className="py-3 px-3">Category</th>
              <th className="py-3 px-3">Item & Description</th>
              <th className="py-3 px-3 text-center">Qty / Unit</th>
              <th className="py-3 px-3 text-right">Unit Est.</th>
              <th className="py-3 px-3 text-right">Subtotal</th>
              <th className="py-3 px-2 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-slate-200">
            {items.map((item) => {
              const unitPrice =
                currency === "USD" ? item.estimatedCostUSD : item.estimatedCostINR;
              const subtotal = unitPrice * item.quantity;

              return (
                <tr
                  key={item.id}
                  className="hover:bg-white/[0.03] transition-colors group"
                >
                  <td className="py-3 px-3 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {getCategoryIcon(item.category)}
                      <span className="font-medium text-slate-300">{item.category}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-semibold text-white">{item.name}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{item.description}</div>
                  </td>
                  <td className="py-3 px-3 text-center whitespace-nowrap">
                    <div className="inline-flex items-center gap-1.5 bg-slate-800/80 px-2 py-1 rounded-md border border-white/10">
                      <button
                        onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                        className="text-slate-400 hover:text-white px-1 disabled:opacity-30"
                        disabled={item.quantity <= 1}
                      >
                        -
                      </button>
                      <span className="font-semibold text-white px-1">{item.quantity}</span>
                      <button
                        onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                        className="text-slate-400 hover:text-white px-1"
                      >
                        +
                      </button>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-slate-300 whitespace-nowrap">
                    {formatCurrency(unitPrice, currency)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-indigo-300 whitespace-nowrap">
                    {formatCurrency(subtotal, currency)}
                  </td>
                  <td className="py-3 px-2 text-center whitespace-nowrap">
                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      className="p-1.5 text-slate-500 hover:text-red-400 transition-colors opacity-60 group-hover:opacity-100"
                      title="Remove item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Action Footer with Add Item & Grand Total */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-white/10">
        <Button
          onClick={handleAddItem}
          variant="outline"
          size="sm"
          className="text-xs gap-1.5 border-dashed border-white/20 hover:border-white/40"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Custom Line Item
        </Button>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="text-xs text-slate-400 block">Grand Estimated Total</span>
            <span className="text-2xl font-extrabold text-white gradient-text">
              {formatCurrency(totalCost, currency)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
