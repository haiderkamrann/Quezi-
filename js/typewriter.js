document.addEventListener("DOMContentLoaded", function() {
    const text = "Get Ready for an Exciting Quiz Adventure!";
    const heading = document.getElementById("heading-typewriter");
    let index = 0;

    function typeWriter() {
        if (index < text.length) {
            heading.textContent += text.charAt(index);
            index++;
            setTimeout(typeWriter, 100);
        }
    }

    typeWriter();
});