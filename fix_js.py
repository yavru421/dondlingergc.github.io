def fix_js_crash():
    with open('c:/Users/John/Desktop/dondlingergc.com/index.html', 'r', encoding='utf-8') as f:
        content = f.read()

    # Wrap telemetry-flow updates
    content = content.replace(
        "document.getElementById('telemetry-flow').textContent =",
        "if(document.getElementById('telemetry-flow')) document.getElementById('telemetry-flow').textContent ="
    )

    # Wrap telemetry-aqi updates
    content = content.replace(
        "document.getElementById('telemetry-aqi').textContent =",
        "if(document.getElementById('telemetry-aqi')) document.getElementById('telemetry-aqi').textContent ="
    )

    with open('c:/Users/John/Desktop/dondlingergc.com/index.html', 'w', encoding='utf-8') as f:
        f.write(content)

if __name__ == "__main__":
    fix_js_crash()
    print("JS crash fixed.")
