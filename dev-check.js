(function() {
            const ua = navigator.userAgent;
            const isMobile = /Mobi|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Windows Phone/i.test(ua);
            const isIPad = (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
            const hasTouchScreen = ('ontouchstart' in window || navigator.maxTouchPoints > 0);
            const screenWidth = window.screen.width;
            
            const isDesktop = !isMobile && !isIPad && (screenWidth >= 1024 || !hasTouchScreen);
            
            if (!isDesktop) {
                window.location.href = 'Sorry, This Web Is not Android Friendly';
            }
        })();