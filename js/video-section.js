document.addEventListener("DOMContentLoaded", () => {
    const ctaButton = document.getElementById("enter-rabbit-hole");
    if (!ctaButton) {
        return;
    }

    ctaButton.addEventListener("click", () => {
        window.location.href = "index.html";
    });
});
