import React from "react";

import '../../public/assets/libs/flatpickr/flatpickr.min.css';
import'../../public/assets/libs/choices.js/public/assets/scripts/choices.min.js';
import '../../public/assets/js/main.js';
import '../../public/assets/libs/bootstrap/css/bootstrap.min.css';
import '../../public/assets/libs/node-waves/waves.min.css';
import '../../public/assets/libs/simplebar/simplebar.min.css';
import '../../public/assets/libs/@simonwep/pickr/themes/nano.min.css';
import '../../public/assets/libs/choices.js/public/assets/styles/choices.min.css';
import '../../public/assets/libs/@tarekraafat/autocomplete.js/css/autoComplete.css';


// Import Popper.js
import '@popperjs/core/dist/umd/popper.min.js';

// Import Bootstrap
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

// Import Defaultmenu JS (assuming it's a custom file)
// import '../assets/js/defaultmenu.min.js';

// Import Node Waves JS
import 'node-waves/dist/waves.min.js';

// Import Sticky JS (assuming it's a custom file)

// Import Simplebar JS

import Pickr from '@simonwep/pickr';

import '@simonwep/pickr/dist/themes/nano.min.css'; // Ensure the correct theme is imported
// Import Auto Complete JS
import autoComplete from '@tarekraafat/autocomplete.js/dist/autoComplete.min.js';

// Import Color Picker JS
// import Pickr from '@simonwep/pickr/dist/pickr.es5.min.js';

// Import Date & Time Picker JS
import flatpickr from 'flatpickr/dist/flatpickr.min.js';

const MainHead = () => {
    return (
        <div>
            {/* Meta Data */}
            <meta charSet="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
            <title> Xintra - Bootstrap 5 Premium Admin &amp; Dashboard Template </title>
            <meta name="Description" content="Bootstrap Responsive Admin Web Dashboard HTML5 Template" />
            <meta name="Author" content="Spruko Technologies Private Limited" />
            <meta name="keywords" content="html, html and css templates, html css and javascript, html css, html javascript, html css bootstrap, admin, bootstrap admin template, bootstrap 5 admin template, dashboard template bootstrap, admin panel template, dashboard panel, bootstrap admin, dashboard, template admin, html admin template" />
            {/* Favicon */}
            <link rel="icon" href="../assets/images/brand-logos/favicon.ico" type="image/x-icon" />
            {/* Choices JS */}
            {/* Main Theme Js */}
            {/* Bootstrap Css */}
            <link id="style" href="../assets/libs/bootstrap/css/bootstrap.min.css" rel="stylesheet" />
            {/* Style Css */}
            <link href="../assets/css/styles.css" rel="stylesheet" />
            {/* Icons Css */}
            <link href="../assets/css/icons.css" rel="stylesheet" />
            {/* Node Waves Css */}
            <link href="../assets/libs/node-waves/waves.min.css" rel="stylesheet" /> 
            {/* Simplebar Css */}
            <link href="../assets/libs/simplebar/simplebar.min.css" rel="stylesheet" />
            {/* Color Picker Css */}
            <link rel="stylesheet" href="../assets/libs/flatpickr/flatpickr.min.css" />
            <link rel="stylesheet" href="../assets/libs/@simonwep/pickr/themes/nano.min.css" />
            {/* Choices Css */}
            <link rel="stylesheet" href="../assets/libs/choices.js/public/assets/styles/choices.min.css" />
            {/* FlatPickr CSS */}
            <link rel="stylesheet" href="../assets/libs/flatpickr/flatpickr.min.css" />
            {/* Auto Complete CSS */}
            <link rel="stylesheet" href="../assets/libs/@tarekraafat/autocomplete.js/css/autoComplete.css" />
        </div>

    );
};
export default MainHead;