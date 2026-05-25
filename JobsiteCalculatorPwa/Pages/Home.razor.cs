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
    private int CurrentStep = 1;
    private ConcreteProjectMode SelectedMode;
    
    private ConcreteSectionInput MainSlab = new() { Name = "Main Slab" };
    private List<ThickenedSectionInput> ThickenedSections = new();
    private ConcreteEstimationResult? Result;
    private bool IsCopied = false;
    private bool IsInstallable = false;
    private bool _firstRenderDone = false;

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

    private void AddThickenedSection()
    {
        ThickenedSections.Add(new ThickenedSectionInput { Name = $"Edge {ThickenedSections.Count + 1}" });
    }

    private void RemoveThickenedSection(int index)
    {
        if (index >= 0 && index < ThickenedSections.Count)
        {
            ThickenedSections.RemoveAt(index);
            // Re-index names
            for (int i = 0; i < ThickenedSections.Count; i++)
            {
                ThickenedSections[i].Name = $"Edge {i + 1}";
            }
        }
    }

    private void Calculate()
    {
        Result = MathEngine.Calculate(SelectedMode, MainSlab, ThickenedSections);
        CurrentStep = 3;
    }

    private void ResetProject()
    {
        CurrentStep = 1;
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
