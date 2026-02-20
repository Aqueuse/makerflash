const carouselInner = document.querySelector('.carousel-inner');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const totalImages = document.querySelectorAll('.carousel-inner img').length;

let currentIndex = 0;
let autoSlideInterval;

// Fonction pour mettre à jour la position du carrousel
function updateCarousel() {
    carouselInner.style.transform = `translateX(-${currentIndex * 100}%)`;
}

// Fonction pour passer à l'image suivante
function nextSlide() {
    currentIndex++;
    if (currentIndex >= totalImages) {
        currentIndex = 0;
    }
    updateCarousel();
}

// Fonction pour revenir à l'image précédente
function prevSlide() {
    currentIndex--;
    if (currentIndex < 0) {
        currentIndex = totalImages - 1;
    }
    updateCarousel();
}

// Lancer le défilement automatique toutes les 3 secondes (3000 millisecondes)
function startAutoSlide() {
    autoSlideInterval = setInterval(nextSlide, 3000);
}

// Réinitialiser le chrono quand on clique sur un bouton
function resetAutoSlide() {
    clearInterval(autoSlideInterval);
    startAutoSlide();
}

// Événements sur les boutons
nextBtn.addEventListener('click', () => {
    nextSlide();
    resetAutoSlide();
});

prevBtn.addEventListener('click', () => {
    prevSlide();
    resetAutoSlide();
});

// Démarrage automatique au chargement de la page
startAutoSlide();
