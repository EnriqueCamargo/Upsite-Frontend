function toggleAccordion(id) {
    const content = document.getElementById(id);
    
    if (content.style.display === "block") {
        content.style.display = "none";
    } else {
        content.style.display = "block";
    }
}