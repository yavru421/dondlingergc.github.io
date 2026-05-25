namespace JobsiteCalculatorPwa.Models;

public class ConcreteSectionInput
{
    public string Name { get; set; } = "Section";
    // Using string to allow fractions or decimals, assuming we will parse them
    // But since the requirement says "ask for Length x Width in feet" and "Thickness in inches", 
    // it's easier to use double for input, or we can use strings if we want to allow 10'4" format.
    // The requirement says: Ask for primary footprint dimensions (Length x Width in feet) and Main Slab Thickness (in inches).
    public double LengthFeet { get; set; }
    public double WidthFeet { get; set; }
    public double ThicknessInches { get; set; }
    
    // Additional fields for other modes
    public double WidthInches { get; set; } // Used for Footings
    public double HeightFeet { get; set; } // Used for Poured Walls
    public bool IsRoundColumn { get; set; } // Used for Columns
    public double DiameterInches { get; set; } // Used for Round Columns
    public int ColumnCount { get; set; } = 1;
}

public class ThickenedSectionInput
{
    public string Name { get; set; } = "Thickened Edge";
    public double LengthFeet { get; set; }
    public double WidthInches { get; set; }
    public double TotalDepthInches { get; set; }
}

public class ConcreteEstimationResult
{
    public List<SectionResult> Sections { get; set; } = new();
    public double TotalCubicYards { get; set; }
    public double TotalCubicYardsWithWaste { get; set; }
    public double TotalCubicFeetWithWaste { get; set; }
    
    // Bag equivalents
    public int Bags40lb { get; set; }
    public int Bags50lb { get; set; }
    public int Bags60lb { get; set; }
    public int Bags80lb { get; set; }
}

public class SectionResult
{
    public string Name { get; set; } = "";
    public double CubicFeet { get; set; }
    public double CubicYards { get; set; }
}
