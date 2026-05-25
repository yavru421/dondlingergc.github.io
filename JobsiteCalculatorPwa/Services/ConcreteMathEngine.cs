using JobsiteCalculatorPwa.Models;
using System;
using System.Collections.Generic;

namespace JobsiteCalculatorPwa.Services;

public class ConcreteMathEngine
{
    public ConcreteEstimationResult Calculate(
        ConcreteProjectMode mode, 
        ConcreteSectionInput mainSlab, 
        List<ThickenedSectionInput>? thickenedSections = null)
    {
        var result = new ConcreteEstimationResult();
        double totalCubicFeet = 0;

        if (mode == ConcreteProjectMode.Slab || mode == ConcreteProjectMode.MonolithicSlab || 
            mode == ConcreteProjectMode.Footings || mode == ConcreteProjectMode.PouredWalls || 
            mode == ConcreteProjectMode.Columns)
        {
            double baseVolumeCf = 0;

            if (mode == ConcreteProjectMode.Columns && mainSlab.IsRoundColumn)
            {
                double radiusFeet = (mainSlab.DiameterInches / 2.0) / 12.0;
                // For columns, LengthFeet acts as the depth/height
                baseVolumeCf = Math.PI * (radiusFeet * radiusFeet) * mainSlab.LengthFeet;
            }
            else if (mode == ConcreteProjectMode.Footings)
            {
                double thicknessFeet = mainSlab.ThicknessInches / 12.0;
                double widthFeet = mainSlab.WidthInches / 12.0;
                baseVolumeCf = mainSlab.LengthFeet * widthFeet * thicknessFeet;
            }
            else if (mode == ConcreteProjectMode.PouredWalls)
            {
                double thicknessFeet = mainSlab.ThicknessInches / 12.0;
                baseVolumeCf = mainSlab.LengthFeet * mainSlab.HeightFeet * thicknessFeet;
            }
            else
            {
                double thicknessFeet = mainSlab.ThicknessInches / 12.0;
                baseVolumeCf = mainSlab.LengthFeet * mainSlab.WidthFeet * thicknessFeet;
            }

            if (baseVolumeCf > 0)
            {
                totalCubicFeet += baseVolumeCf;
                result.Sections.Add(new SectionResult
                {
                    Name = mainSlab.Name,
                    CubicFeet = Math.Round(baseVolumeCf, 2),
                    CubicYards = Math.Round(baseVolumeCf / 27.0, 2)
                });
            }
        }

        if (mode == ConcreteProjectMode.MonolithicSlab && thickenedSections != null)
        {
            for (int i = 0; i < thickenedSections.Count; i++)
            {
                var ts = thickenedSections[i];
                
                // Formula 2: The Overlap Rule (Net Added Depth)
                // Δ(NetDepth) = TotalTrenchDepth - MainSlabThickness
                double netDepthInches = ts.TotalDepthInches - mainSlab.ThicknessInches;
                
                // If net depth is <= 0, it means the trench is shallower or equal to the main slab, so no extra concrete is needed beneath it
                if (netDepthInches > 0)
                {
                    double netDepthFeet = netDepthInches / 12.0;
                    double widthFeet = ts.WidthInches / 12.0;

                    // Formula 3: Thickened Section Volume
                    // Vtrench = TrenchLength * TrenchWidth * Δ
                    double trenchVolumeCf = ts.LengthFeet * widthFeet * netDepthFeet;

                    totalCubicFeet += trenchVolumeCf;
                    result.Sections.Add(new SectionResult
                    {
                        Name = ts.Name,
                        CubicFeet = Math.Round(trenchVolumeCf, 2),
                        CubicYards = Math.Round(trenchVolumeCf / 27.0, 2)
                    });
                }
            }
        }

        // Formula 4: Total & Waste Logic
        result.TotalCubicYards = totalCubicFeet / 27.0;
        
        // Add 10% waste
        double totalVolumeWithWasteCy = result.TotalCubicYards * 1.10;
        
        // Rounding Rule: Final Total Order Volume rounded up to nearest 1/4 cubic yard (0.25)
        double roundedCy = Math.Ceiling(totalVolumeWithWasteCy * 4.0) / 4.0;
        
        result.TotalCubicYardsWithWaste = roundedCy;
        result.TotalCubicFeetWithWaste = roundedCy * 27.0;

        // Bag Equivalents (Calculated on exact raw volume + 10% waste, prior to ready-mix rounding)
        double exactVolumeCfWithWaste = totalCubicFeet * 1.10;
        
        // 40 lb bag: 0.30 ft³
        // 50 lb bag: 0.375 ft³
        // 60 lb bag: 0.45 ft³
        // 80 lb bag: 0.60 ft³.
        result.Bags40lb = (int)Math.Ceiling(exactVolumeCfWithWaste / 0.30);
        result.Bags50lb = (int)Math.Ceiling(exactVolumeCfWithWaste / 0.375);
        result.Bags60lb = (int)Math.Ceiling(exactVolumeCfWithWaste / 0.45);
        result.Bags80lb = (int)Math.Ceiling(exactVolumeCfWithWaste / 0.60);

        return result;
    }
}
