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

    // Central Wisconsin Local Estimator & Lead Bridge State
    private string SelectedCity = "Wisconsin Rapids";
    private string ContactPhone = "";
    private string LeadSubmitText = "Request Site Walk";
    private string? LeadStatusMessage;

    private string GetTurnkeyRange()
    {
        if (Result == null) return "$0";
        // Average turnkey slab/flatwork rate in Central WI is ~$11.50-$14.50/sq ft (or ~$160-$195/yd ready-mix + prep/finish)
        // Monolithic or standard slab based on calculated cubic yards
        double yards = Result.TotalCubicYardsWithWaste;
        double baseTurnkey = yards * 540; // rough turnkey materials + labor
        
        // City factor adjustments
        double cityMultiplier = SelectedCity switch
        {
            "Plover" => 1.02,
            "Stevens Point" => 1.03,
            "Marshfield" => 1.05,
            "Wausau" => 1.06,
            _ => 1.0 // Wisconsin Rapids
        };

        double low = Math.Round(baseTurnkey * 0.90 * cityMultiplier);
        double high = Math.Round(baseTurnkey * 1.15 * cityMultiplier);
        return $"${low:N0} – ${high:N0}";
    }

    private string GetVoiceIntakeUrl()
    {
        if (Result == null) return "https://voice-intake-app.dondlingergc.com/";
        return $"https://voice-intake-app.dondlingergc.com/?ref=pourready&trade=concrete&city={Uri.EscapeDataString(SelectedCity)}&yards={Result.TotalCubicYardsWithWaste}&range={Uri.EscapeDataString(GetTurnkeyRange())}";
    }

    private string GetPhotoIntakeUrl()
    {
        return $"/intake.html?ref=pourready&trade=concrete&city={Uri.EscapeDataString(SelectedCity)}";
    }

    private async Task SubmitQuickLead()
    {
        if (string.IsNullOrWhiteSpace(ContactPhone) || ContactPhone.Length < 7)
        {
            LeadStatusMessage = "Please enter a valid phone number.";
            return;
        }

        LeadSubmitText = "Sending...";
        try
        {
            string payloadJson = $"{{\"name\":\"PourReady Visitor ({SelectedCity})\",\"phone\":\"{ContactPhone}\",\"project_type\":\"Concrete / PourReady - {GetProjectTypeName()}\",\"city\":\"{SelectedCity}\",\"notes\":\"Calculated Volume: {Result?.TotalCubicYardsWithWaste} yards ({Math.Round(Result?.TotalCubicFeetWithWaste ?? 0, 2)} cu ft). Estimated Turnkey: {GetTurnkeyRange()}. Generated in PourReady WASM.\"}}";
            string res = await JSRuntime.InvokeAsync<string>("authFetch", "/api/intake", "POST", payloadJson);
            LeadStatusMessage = "✓ Estimate sent directly to J. Dondlinger! We will call or text shortly.";
            LeadSubmitText = "✓ Sent";
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Intake error: {ex.Message}");
            LeadStatusMessage = "Unable to dispatch automatically. Call or text (715) directly.";
            LeadSubmitText = "Request Site Walk";
        }
    }

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
