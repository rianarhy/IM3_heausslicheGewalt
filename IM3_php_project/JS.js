/* =================================================
   HEADER — AKTIVE SECTION
================================================= */

const startButton =
    document.querySelector(
        '.nav-button[href="#start"]'
    );

const aboutButton =
    document.querySelector(
        '.nav-button[href="#about"]'
    );

const aboutSection =
    document.querySelector("#about");


function updateActiveNavigation() {

    if (
        !startButton ||
        !aboutButton ||
        !aboutSection
    ) {
        return;
    }


    const aboutTop =
        aboutSection
            .getBoundingClientRect()
            .top;


    /*
      Sobald ABOUT ungefähr die obere
      Hälfte des Bildschirms erreicht,
      wechseln wir die Navigation.
    */

    if (aboutTop < window.innerHeight * 0.45) {

        startButton
            .classList
            .remove("active");

        aboutButton
            .classList
            .add("active");

    } else {

        aboutButton
            .classList
            .remove("active");

        startButton
            .classList
            .add("active");

    }

}


window.addEventListener(
    "scroll",
    updateActiveNavigation,
    { passive: true }
);


updateActiveNavigation();