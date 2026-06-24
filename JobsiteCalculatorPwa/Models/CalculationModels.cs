namespace JobsiteCalculatorPwa.Models;

public enum TapeOperation
{
    Add,
    Subtract
}

public sealed record FieldProfile(string Name, string Description, string ShortHint, int PrecisionDenominator, int WastePercent);

public sealed record ConstructionExpressionInput(string Expression, DisplayMode DisplayMode, int PrecisionDenominator);

public sealed record ConstructionExpressionResult(
    string Expression,
    string Primary,
    string FeetAndInches,
    string FractionalInches,
    string DecimalFeet,
    string Metric,
    string Breakdown);

public sealed record TapeMathInput(string Left, string Right, TapeOperation Operation, int Quantity, DisplayMode DisplayMode, int PrecisionDenominator);

public sealed record TapeMathResult(
    string Primary,
    string FractionalInches,
    string DecimalFeet,
    string Metric,
    string QuantityTotal,
    string Breakdown);

public sealed record EqualSpacingInput(string Opening, string ItemWidth, int ItemCount, bool IncludeEdgeGaps, int PrecisionDenominator, DisplayMode DisplayMode);

public sealed record EqualSpacingResult(
    string Gap,
    string CenterToCenter,
    string FreeSpace,
    string GapCount,
    string Mode,
    string Breakdown);

public sealed record ConcreteInput(string Length, string Width, string Thickness, int WastePercent);

public sealed record ConcreteResult(
    string Area,
    string CubicFeet,
    string CubicYards,
    string CubicYardsWithWaste,
    string Bags60,
    string Bags80,
    string WastePercent,
    string Breakdown);

public sealed record StairInput(string TotalRise, string TargetRise, string MaxRise, int PrecisionDenominator);

public sealed record StairResult(
    string RiserCount,
    string TreadCount,
    string ActualRise,
    string TotalRise,
    string CodeCheck,
    string Breakdown);

public sealed record BoardFootInput(string Thickness, string Width, string Length, int Quantity);

public sealed record BoardFootResult(
    string TotalBoardFeet,
    string PerPieceBoardFeet,
    string LinearFeet,
    string CubicFeet,
    string Quantity,
    string Breakdown);
