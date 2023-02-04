window.onload = () => {
    'use strict';
    
    console.log(navigator);
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
               .register('./serviceWorker.js');
        console.log("here");
    }
  }