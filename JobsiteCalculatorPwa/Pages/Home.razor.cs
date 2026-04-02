using Microsoft.AspNetCore.Components;
using JobsiteCalculatorPwa.Models;
using JobsiteCalculatorPwa.Services;
using System.Text.RegularExpressions;

namespace JobsiteCalculatorPwa.Pages;

public partial class Home : ComponentBase
{
    [Inject]
    private ConstructionMathService Calculator { get; set; } = default!;

    // ── Mode ────────────────────────────────────────────────────────────────

    private enum AppMode { Tape, Spacing, Concrete, Stairs, BoardFeet }
    private AppMode ActiveMode = AppMode.Tape;

    private void SetMode(AppMode mode)
    {
        ActiveMode = mode;
        ClearAllErrors();
    }

    private void ClearAllErrors()
    {
        ExpressionError = null;
        SpacingError = null;
        ConcreteError = null;
        StairsError = null;
        BoardFeetError = null;
    }

    // ── Shared settings ─────────────────────────────────────────────────────

    private readonly int[] PrecisionOptions = [64, 32, 16, 8, 4, 2];
    private DisplayMode PreferredDisplay = DisplayMode.FeetAndInches;
    private int PrecisionDenominator = 16;

    private static string GetDisplayLabel(DisplayMode mode) =>
        mode switch
        {
            DisplayMode.FeetAndInches => "Feet + inches",
            DisplayMode.FractionalInches => "Fraction inches",
            DisplayMode.DecimalFeet => "Decimal feet",
            DisplayMode.Millimeters => "Millimeters",
            _ => mode.ToString(),
        };

    // ── Tape mode ────────────────────────────────────────────────────────────

    private readonly ExampleExpression[] Examples =
    [
        new("Inside add", "1'5\" + (12\" + 15\")", "Simple parenthesis check"),
        new("Repeated run", "((3'11 1/2\" + 5/8\") * 6) - 1/4\"", "Good for repeated parts"),
        new("Split a difference", "(7'11 1/4\" - 3'5 1/4\") / 3", "Common layout math"),
    ];

    private readonly List<HistoryEntry> History = [];

    private string _expression = "1'5\" + (12\" + 15\")=";
    private ConstructionExpressionResult? Result;
    private string? ExpressionError;

    private string Expression
    {
        get => _expression;
        set
        {
            if (string.Equals(_expression, value, StringComparison.Ordinal)) return;
            var formatted = Regex.Replace(value, @"\s*([+\-*/])\s*", " $1 ");
            _expression = formatted;
            RefreshResult();
        }
    }

    private void RefreshResult()
    {
        if (string.IsNullOrWhiteSpace(Expression))
        {
            Result = null;
            ExpressionError = null;
            return;
        }
        EvaluateExpression(addToHistory: false);
    }

    private void SolveExpression()
    {
        _expression = NormalizeExpression(Expression);
        EvaluateExpression(addToHistory: true);
    }

    private void EvaluateExpression(bool addToHistory)
    {
        try
        {
            Result = Calculator.EvaluateExpression(new ConstructionExpressionInput(
                Expression,
                PreferredDisplay,
                PrecisionDenominator));

            ExpressionError = null;

            if (addToHistory)
            {
                AddHistory(Result);
            }
        }
        catch (Exception ex)
        {
            if (!addToHistory)
            {
                ExpressionError = null; // silent on live update
            }
            else
            {
                Result = null;
                ExpressionError = ex.Message;
            }
        }
    }

    private void AppendToken(string value)
    {
        if (value == "'" || value == "\"")
        {
            Expression = Regex.Replace(Expression, @"(\d|\d+\/\d)\s*$", "$1") + value;
        }
        else if (value is "+" or "-" or "*" or "/")
        {
            Expression += " " + value + " ";
        }
        else
        {
            Expression += value;
        }
        Expression = NormalizeExpression(Expression);
    }

    private void Backspace()
    {
        if (Expression.Length == 0) return;

        var expr = Expression;

        if (expr.EndsWith('\'') || expr.EndsWith('"'))
        {
            Expression = expr[..^1];
            return;
        }

        var fracMatch = Regex.Match(expr, @"(\d+\/\d+)$");
        if (fracMatch.Success)
        {
            Expression = expr[..^fracMatch.Length];
            return;
        }

        var opMatch = Regex.Match(expr, @"\s([+\-*/])\s$");
        if (opMatch.Success)
        {
            Expression = expr[..^opMatch.Length];
            return;
        }

        Expression = expr[..^1];
    }

    private void ClearExpression() => Expression = string.Empty;

    private void LoadExample(string expression)
    {
        Expression = expression;
        SolveExpression();
    }

    private void AddHistory(ConstructionExpressionResult result)
    {
        History.RemoveAll(e => string.Equals(e.Expression, result.Expression, StringComparison.OrdinalIgnoreCase));
        History.Insert(0, new HistoryEntry(result.Expression, result.Primary));
        if (History.Count > 6) History.RemoveRange(6, History.Count - 6);
    }

    private static string NormalizeExpression(string expr)
    {
        if (string.IsNullOrWhiteSpace(expr)) return string.Empty;
        expr = Regex.Replace(expr, @"\s*([+\-*/])\s*", " $1 ");
        expr = Regex.Replace(expr, @"\s+", " ");
        expr = Regex.Replace(expr, @"(\d|\d+\/\d)\s*(['""])", "$1$2");
        expr = Regex.Replace(expr, @"\s+(['""])", "$1");
        expr = Regex.Replace(expr, @"(\d+)\s*\/\s*(\d+)", "$1/$2");
        expr = Regex.Replace(expr, @"\(\s*", "(");
        expr = Regex.Replace(expr, @"\s*\)", ")");
        expr = Regex.Replace(expr, @"([+\-*/])\s*$", "");
        return expr.Trim();
    }

    // ── Spacing mode ─────────────────────────────────────────────────────────

    private string SpacingOpening = string.Empty;
    private string SpacingItemWidth = string.Empty;
    private int SpacingItemCount = 1;
    private bool SpacingIncludeEdgeGaps = true;
    private EqualSpacingResult? SpacingResult;
    private string? SpacingError;

    private void SolveSpacing()
    {
        try
        {
            SpacingResult = Calculator.SolveEqualSpacing(new EqualSpacingInput(
                SpacingOpening,
                SpacingItemWidth,
                SpacingItemCount,
                SpacingIncludeEdgeGaps,
                PrecisionDenominator,
                PreferredDisplay));
            SpacingError = null;
        }
        catch (Exception ex)
        {
            SpacingResult = null;
            SpacingError = ex.Message;
        }
    }

    private void ClearSpacing()
    {
        SpacingOpening = string.Empty;
        SpacingItemWidth = string.Empty;
        SpacingItemCount = 1;
        SpacingIncludeEdgeGaps = true;
        SpacingResult = null;
        SpacingError = null;
    }

    // ── Concrete mode ─────────────────────────────────────────────────────────

    private string ConcreteLength = string.Empty;
    private string ConcreteWidth = string.Empty;
    private string ConcreteThickness = "4\"";
    private int ConcreteWaste = 10;
    private ConcreteResult? ConcreteCalcResult;
    private string? ConcreteError;

    private void SolveConcrete()
    {
        try
        {
            ConcreteCalcResult = Calculator.SolveConcrete(new ConcreteInput(
                ConcreteLength,
                ConcreteWidth,
                ConcreteThickness,
                ConcreteWaste));
            ConcreteError = null;
        }
        catch (Exception ex)
        {
            ConcreteCalcResult = null;
            ConcreteError = ex.Message;
        }
    }

    private void ClearConcrete()
    {
        ConcreteLength = string.Empty;
        ConcreteWidth = string.Empty;
        ConcreteThickness = "4\"";
        ConcreteWaste = 10;
        ConcreteCalcResult = null;
        ConcreteError = null;
    }

    // ── Stairs mode ───────────────────────────────────────────────────────────

    private string StairsTotalRise = string.Empty;
    private string StairsTargetRise = "7 1/2\"";
    private string StairsMaxRise = "7 3/4\"";
    private StairResult? StairsCalcResult;
    private string? StairsError;

    private void SolveStairs()
    {
        try
        {
            StairsCalcResult = Calculator.SolveStairs(new StairInput(
                StairsTotalRise,
                StairsTargetRise,
                StairsMaxRise,
                PrecisionDenominator));
            StairsError = null;
        }
        catch (Exception ex)
        {
            StairsCalcResult = null;
            StairsError = ex.Message;
        }
    }

    private void ClearStairs()
    {
        StairsTotalRise = string.Empty;
        StairsTargetRise = "7 1/2\"";
        StairsMaxRise = "7 3/4\"";
        StairsCalcResult = null;
        StairsError = null;
    }

    // ── Board Feet mode ───────────────────────────────────────────────────────

    private string BfThickness = "1\"";
    private string BfWidth = string.Empty;
    private string BfLength = string.Empty;
    private int BfQuantity = 1;
    private BoardFootResult? BfResult;
    private string? BoardFeetError;

    private void SolveBoardFeet()
    {
        try
        {
            BfResult = Calculator.SolveBoardFeet(new BoardFootInput(
                BfThickness,
                BfWidth,
                BfLength,
                BfQuantity));
            BoardFeetError = null;
        }
        catch (Exception ex)
        {
            BfResult = null;
            BoardFeetError = ex.Message;
        }
    }

    private void ClearBoardFeet()
    {
        BfThickness = "1\"";
        BfWidth = string.Empty;
        BfLength = string.Empty;
        BfQuantity = 1;
        BfResult = null;
        BoardFeetError = null;
    }

    // ── Records ───────────────────────────────────────────────────────────────

    private sealed record ExampleExpression(string Label, string Expression, string Note);
    private sealed record HistoryEntry(string Expression, string Result);
}
