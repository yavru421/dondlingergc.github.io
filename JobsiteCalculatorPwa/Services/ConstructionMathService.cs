using System.Globalization;
using JobsiteCalculatorPwa.Models;

namespace JobsiteCalculatorPwa.Services;

public sealed class ConstructionMathService
{
    public ConstructionExpressionResult EvaluateExpression(ConstructionExpressionInput input)
    {
        if (string.IsNullOrWhiteSpace(input.Expression))
        {
            throw new InvalidOperationException("Enter a jobsite expression to solve.");
        }

        var cleanedExpression = input.Expression.Trim();
        while (cleanedExpression.EndsWith("=", StringComparison.Ordinal))
        {
            cleanedExpression = cleanedExpression[..^1].TrimEnd();
        }

        if (string.IsNullOrWhiteSpace(cleanedExpression))
        {
            throw new InvalidOperationException("Enter a jobsite expression to solve.");
        }

        var evaluator = new ConstructionExpressionEvaluator(cleanedExpression);
        var evaluated = evaluator.Evaluate();
        var result = new Measurement(evaluated.Value);

        return new ConstructionExpressionResult(
            Expression: cleanedExpression,
            Primary: result.ToPrimaryString(input.DisplayMode, input.PrecisionDenominator),
            FeetAndInches: result.ToFeetAndInchesString(input.PrecisionDenominator),
            FractionalInches: result.ToFractionalInchesString(input.PrecisionDenominator),
            DecimalFeet: result.ToDecimalFeetString(),
            Metric: result.ToMetricString(),
            Breakdown: $"{cleanedExpression} = {result.ToFeetAndInchesString(input.PrecisionDenominator)}");
    }

    public TapeMathResult SolveTapeMath(TapeMathInput input)
    {
        var left = MeasurementParser.Parse(input.Left);
        var right = string.IsNullOrWhiteSpace(input.Right) ? new Measurement(FractionValue.Zero) : MeasurementParser.Parse(input.Right);
        var result = input.Operation == TapeOperation.Add ? left + right : left - right;
        var quantity = Math.Max(1, input.Quantity);
        var quantityTotal = result * quantity;

        return new TapeMathResult(
            Primary: result.ToPrimaryString(input.DisplayMode, input.PrecisionDenominator),
            FractionalInches: result.ToFractionalInchesString(input.PrecisionDenominator),
            DecimalFeet: result.ToDecimalFeetString(),
            Metric: result.ToMetricString(),
            QuantityTotal: quantityTotal.ToFeetAndInchesString(input.PrecisionDenominator),
            Breakdown: $"{left.ToFeetAndInchesString(input.PrecisionDenominator)} {(input.Operation == TapeOperation.Add ? "+" : "-")} {right.ToFeetAndInchesString(input.PrecisionDenominator)} = {result.ToFeetAndInchesString(input.PrecisionDenominator)}");
    }

    public EqualSpacingResult SolveEqualSpacing(EqualSpacingInput input)
    {
        if (input.ItemCount < 1)
        {
            throw new InvalidOperationException("Item count must be at least 1.");
        }

        var opening = MeasurementParser.Parse(input.Opening);
        var itemWidth = MeasurementParser.Parse(input.ItemWidth);
        var totalItems = itemWidth * input.ItemCount;
        var freeSpace = opening - totalItems;

        if (freeSpace.TotalInches.Numerator < 0)
        {
            throw new InvalidOperationException("Items are wider than the opening.");
        }

        var gapCount = input.IncludeEdgeGaps ? input.ItemCount + 1 : Math.Max(1, input.ItemCount - 1);
        var gap = freeSpace / gapCount;
        var centerline = gap + itemWidth;

        return new EqualSpacingResult(
            Gap: gap.ToPrimaryString(input.DisplayMode, input.PrecisionDenominator),
            CenterToCenter: centerline.ToFeetAndInchesString(input.PrecisionDenominator),
            FreeSpace: freeSpace.ToFractionalInchesString(input.PrecisionDenominator),
            GapCount: gapCount.ToString(CultureInfo.InvariantCulture),
            Mode: input.IncludeEdgeGaps ? "Edge gaps included" : "Between items only",
            Breakdown: $"{opening.ToFeetAndInchesString(input.PrecisionDenominator)} opening - {input.ItemCount} x {itemWidth.ToFractionalInchesString(input.PrecisionDenominator)} leaves {freeSpace.ToFractionalInchesString(input.PrecisionDenominator)} to split across {gapCount} gaps.");
    }

    public ConcreteResult SolveConcrete(ConcreteInput input)
    {
        var length = MeasurementParser.Parse(input.Length);
        var width = MeasurementParser.Parse(input.Width);
        var thickness = MeasurementParser.Parse(input.Thickness);

        var areaSquareFeet = (length.FeetDecimal * width.FeetDecimal);
        var cubicFeet = (length.InchesDecimal * width.InchesDecimal * thickness.InchesDecimal) / 1728m;
        var cubicYards = cubicFeet / 27m;
        var cubicYardsWithWaste = cubicYards * (100m + input.WastePercent) / 100m;
        var bags60 = (int)Math.Ceiling(cubicFeet / 0.45m);
        var bags80 = (int)Math.Ceiling(cubicFeet / 0.60m);

        return new ConcreteResult(
            Area: $"{areaSquareFeet.ToString("0.##", CultureInfo.InvariantCulture)} sq ft",
            CubicFeet: $"{cubicFeet.ToString("0.##", CultureInfo.InvariantCulture)} cu ft",
            CubicYards: $"{cubicYards.ToString("0.##", CultureInfo.InvariantCulture)} yd^3",
            CubicYardsWithWaste: $"{cubicYardsWithWaste.ToString("0.##", CultureInfo.InvariantCulture)} yd^3",
            Bags60: $"{bags60} bags",
            Bags80: $"{bags80} bags",
            WastePercent: $"{input.WastePercent}%",
            Breakdown: $"{length.ToFeetAndInchesString(16)} x {width.ToFeetAndInchesString(16)} x {thickness.ToFractionalInchesString(16)} = {cubicFeet.ToString("0.##", CultureInfo.InvariantCulture)} cubic feet before waste.");
    }

    public StairResult SolveStairs(StairInput input)
    {
        var totalRise = MeasurementParser.Parse(input.TotalRise);
        var targetRise = MeasurementParser.Parse(input.TargetRise);
        var maxRise = MeasurementParser.Parse(input.MaxRise);

        if (targetRise.InchesDecimal <= 0 || maxRise.InchesDecimal <= 0)
        {
            throw new InvalidOperationException("Target and maximum riser values must be positive.");
        }

        var targetCount = Math.Max(1, (int)Math.Round(totalRise.InchesDecimal / targetRise.InchesDecimal, MidpointRounding.AwayFromZero));
        var minimumCountForMax = Math.Max(1, (int)Math.Ceiling(totalRise.InchesDecimal / maxRise.InchesDecimal));
        var riserCount = Math.Max(targetCount, minimumCountForMax);
        var actualRise = totalRise / riserCount;
        var treads = Math.Max(0, riserCount - 1);
        var codeCheck = actualRise.InchesDecimal <= maxRise.InchesDecimal ? "Within limit" : "Over limit";

        return new StairResult(
            RiserCount: riserCount.ToString(CultureInfo.InvariantCulture),
            TreadCount: treads.ToString(CultureInfo.InvariantCulture),
            ActualRise: actualRise.ToFeetAndInchesString(input.PrecisionDenominator),
            TotalRise: totalRise.ToFeetAndInchesString(input.PrecisionDenominator),
            CodeCheck: codeCheck,
            Breakdown: $"{totalRise.ToFeetAndInchesString(input.PrecisionDenominator)} total rise / {riserCount} risers = {actualRise.ToFractionalInchesString(input.PrecisionDenominator)} actual rise.");
    }

    public BoardFootResult SolveBoardFeet(BoardFootInput input)
    {
        if (input.Quantity < 1)
        {
            throw new InvalidOperationException("Quantity must be at least 1.");
        }

        var thickness = MeasurementParser.Parse(input.Thickness);
        var width = MeasurementParser.Parse(input.Width);
        var length = MeasurementParser.Parse(input.Length);

        var perPieceBoardFeet = (thickness.InchesDecimal * width.InchesDecimal * length.InchesDecimal) / 144m;
        var totalBoardFeet = perPieceBoardFeet * input.Quantity;
        var linearFeet = length.FeetDecimal * input.Quantity;
        var cubicFeet = (thickness.InchesDecimal * width.InchesDecimal * length.InchesDecimal * input.Quantity) / 1728m;

        return new BoardFootResult(
            TotalBoardFeet: $"{totalBoardFeet.ToString("0.##", CultureInfo.InvariantCulture)} bd ft",
            PerPieceBoardFeet: $"{perPieceBoardFeet.ToString("0.##", CultureInfo.InvariantCulture)} bd ft",
            LinearFeet: $"{linearFeet.ToString("0.##", CultureInfo.InvariantCulture)} lin ft",
            CubicFeet: $"{cubicFeet.ToString("0.##", CultureInfo.InvariantCulture)} cu ft",
            Quantity: input.Quantity.ToString(CultureInfo.InvariantCulture),
            Breakdown: $"{thickness.ToFractionalInchesString(16)} x {width.ToFractionalInchesString(16)} x {length.ToFeetAndInchesString(16)} across {input.Quantity} pieces.");
    }
}
