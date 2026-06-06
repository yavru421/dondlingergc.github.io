using System;
using System.Collections.Generic;
using System.Text;
using System.Threading.Tasks;
using JobsiteCalculatorPwa.Models;
using Microsoft.AspNetCore.Components;
using Microsoft.JSInterop;

namespace JobsiteCalculatorPwa.Pages;

public partial class Home : ComponentBase
{
    [Inject]
    private NavigationManager Navigation { get; set; } = default!;

    private int CurrentStep = 1;
    private ConcreteProjectMode SelectedMode;
    
    private ConcreteSectionInput MainSlab = new() { Name = "Main Slab" };
    private List<ThickenedSectionInput> ThickenedSections = new();
    private ConcreteEstimationResult? Result;
    private bool IsCopied = false;
    private bool IsInstallable = false;
    private bool _firstRenderDone = false;
    private int WastePercent = 10;
    private string? _validationError;

    private void OpenTriangleCalculator()
    {
        Navigation.NavigateTo("triangle");
    }

    protected override async Task OnAfterRenderAsync(bool firstRender)
    {
        if (!_firstRenderDone)
        {
            _firstRenderDone = true;
            try
            {
                IsInstallable = await JSRuntime.InvokeAsync<bool>("pwaInstall.isAvailable");
                StateHasChanged();
            }
            catch { /* JS not ready yet */ }
        }
    }

    private void SelectProject(ConcreteProjectMode mode)
    {
        SelectedMode = mode;
        CurrentStep = 2;
        _validationError = null;
        WastePercent = 10;
        
        // Reset defaults
        MainSlab = new ConcreteSectionInput { Name = "Main Slab" };
        if (mode == ConcreteProjectMode.Columns)
        {
            MainSlab.IsRoundColumn = true;
        }
        ThickenedSections.Clear();
        Result = null;
        IsCopied = false;
    }

    private string GetProjectTypeName()
    {
        return SelectedMode switch
        {
            ConcreteProjectMode.Slab => "Slab",
            ConcreteProjectMode.MonolithicSlab => "Monolithic Slab",
            ConcreteProjectMode.Footings => "Footings",
            ConcreteProjectMode.PouredWalls => "Poured Walls",
            ConcreteProjectMode.Columns => "Columns",
            _ => "Project"
        };
    }

    private void EditProject()
    {
        CurrentStep = 2;
    }

    private void AddThickenedSection()
    {
        ThickenedSections.Add(new ThickenedSectionInput());
    }

    private void RemoveThickenedSection(int index)
    {
        if (index >= 0 && index < ThickenedSections.Count)
        {
            ThickenedSections.RemoveAt(index);
        }
    }

    private void Calculate()
    {
        // Validation
        _validationError = null;

        if (SelectedMode == ConcreteProjectMode.Slab || SelectedMode == ConcreteProjectMode.MonolithicSlab)
        {
            if (!(MainSlab.LengthFeet > 0 && MainSlab.WidthFeet > 0 && MainSlab.ThicknessInches > 0))
            {
                _validationError = "Please enter all dimensions (Length, Width, and Thickness).";
                return;
            }
        }
        else if (SelectedMode == ConcreteProjectMode.Footings)
        {
            if (!(MainSlab.LengthFeet > 0 && MainSlab.WidthInches > 0 && MainSlab.ThicknessInches > 0))
            {
                _validationError = "Please enter Length, Width (in), and Thickness (in).";
                return;
            }
        }
        else if (SelectedMode == ConcreteProjectMode.PouredWalls)
        {
            if (!(MainSlab.LengthFeet > 0 && MainSlab.HeightFeet > 0 && MainSlab.ThicknessInches > 0))
            {
                _validationError = "Please enter Length, Height, and Thickness.";
                return;
            }
        }
        else if (SelectedMode == ConcreteProjectMode.Columns && MainSlab.IsRoundColumn)
        {
            if (!(MainSlab.DiameterInches > 0 && MainSlab.LengthFeet > 0))
            {
                _validationError = "Please enter Diameter and Depth.";
                return;
            }
        }
        else if (SelectedMode == ConcreteProjectMode.Columns && !MainSlab.IsRoundColumn)
        {
            if (!(MainSlab.LengthFeet > 0 && MainSlab.WidthFeet > 0 && MainSlab.ThicknessInches > 0))
            {
                _validationError = "Please enter Length, Width, and Depth.";
                return;
            }
        }

        Result = MathEngine.Calculate(SelectedMode, MainSlab, ThickenedSections, WastePercent);
        CurrentStep = 3;
    }

    private void GoBack()
    {
        CurrentStep = 1;
        _validationError = null;
    }

    private void ResetProject()
    {
        CurrentStep = 1;
        _validationError = null;
        WastePercent = 10;
        SelectedMode = default;
        MainSlab = new ConcreteSectionInput { Name = "Main Slab" };
        ThickenedSections.Clear();
        Result = null;
        IsCopied = false;
    }

    private async Task CopyToClipboard()
    {
        if (Result == null) return;

        var sb = new StringBuilder();
        sb.AppendLine("| Section | Cubic Feet | Cubic Yards |");
        sb.AppendLine("| --- | --- | --- |");
        foreach (var section in Result.Sections)
        {
            sb.AppendLine($"| {section.Name} | {section.CubicFeet} | {section.CubicYards} |");
        }
        sb.AppendLine($"| **Total Order Volume** | **{Math.Round(Result.TotalCubicFeetWithWaste, 2)} Cubic Feet** | **{Result.TotalCubicYardsWithWaste} Yards** |");
        sb.AppendLine();
        sb.AppendLine("### Bag Equivalents");
        sb.AppendLine($"- 40 lb bags: {Result.Bags40lb}");
        sb.AppendLine($"- 50 lb bags: {Result.Bags50lb}");
        sb.AppendLine($"- 60 lb bags: {Result.Bags60lb}");
        sb.AppendLine($"- 80 lb bags: {Result.Bags80lb}");

        try
        {
            bool success = await JSRuntime.InvokeAsync<bool>("clipboardFunctions.copyText", sb.ToString());
            if (success)
            {
                IsCopied = true;
                StateHasChanged();
                await Task.Delay(2000);
                IsCopied = false;
                StateHasChanged();
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error copying to clipboard: {ex.Message}");
        }
    }

    private async Task InstallPwa()
    {
        try
        {
            var accepted = await JSRuntime.InvokeAsync<bool>("pwaInstall.prompt");
            if (accepted)
            {
                IsInstallable = false;
                StateHasChanged();
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"PWA install error: {ex.Message}");
        }
    }
}
