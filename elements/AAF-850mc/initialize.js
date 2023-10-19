function(instance, context) {
    const styleTagID = "group-focus-relocator-styles";
    let styleTag = document.getElementById(styleTagID);
    if (!styleTag) {
        styleTag = document.createElement("style");
        styleTag.id = styleTagID;
        document.head.appendChild(styleTag); // must append before you can access sheet property
    }

    const hiddenObserver = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutationRecord) {
            const target = mutationRecord.target;
            if (target.style.display === "none") {
                instance.data.runCleanup({
                    fade: instance.data.baseProperties.animate_appearance
                });
            }
        });    
    });


    instance.data.watchHiddenEvent = function(element) {
        hiddenObserver.observe(element, { attributes : true, attributeFilter : ['style'] });
    }

    function createStylingRule(selectorText, defaultBody) {
        const stylesheet = styleTag.sheet;
        let elementRule = [...stylesheet.rules].find(rule => rule.selectorText === selectorText);
        if (!elementRule) {
            const ruleIndex = stylesheet.insertRule(`${selectorText} { ${defaultBody} }`);
            elementRule = stylesheet.rules[ruleIndex];
        }

        return elementRule;
    }

    instance.data.loadElementStyle = function() {
        instance.data.elementRule = createStylingRule(
            `#${instance.data.groupFocusId}`, 
            `
				visibility: visible !important;
				display: block !important;
                transition-timing-function: ease-in-out;
                opacity: 0;
`
        );
    }

    function setStylingRule(rule, style) {
        if (!rule) {
            return;
        }
        Object.keys(style).forEach(name => {
            rule.style.setProperty(name, style[name], "important");
        });
    }

    function setStyle(style) {
        setStylingRule(instance.data.elementRule, style);
    }

    instance.data.setStyle = setStyle;

    function applyTransition(delay, transitionProperties, afterCleanupCallback) {
        if (delay && transitionProperties && transitionProperties.length) {
            if (instance.data.transitionTimeout) {
                clearTimeout(instance.data.transitionTimeout);
            }
            const transitionString = transitionProperties.map(p => `${p} ${delay}ms`).join(",");
            setStyle({
                transition: transitionString,
            });

            instance.data.transitionTimeout = setTimeout(function () {
                setStyle({
                    transition: `0s`,
                });
                instance.data.transitionTimeout = null;
                if (afterCleanupCallback) {
                    afterCleanupCallback()
                };
            }, delay * 1.5);

        }
    }

    instance.data.applyTransition = applyTransition;

    instance.data.runCleanup = function ({fade} = {}) {
        if (instance.data._cleanupFunc) {
            instance.data._cleanupFunc();
            instance.data._cleanupFunc = null;
        }
        hiddenObserver.disconnect();
        if (fade) {
            applyTransition(200, ["opacity"], function () {
                setStyle({
                    left: `${OUTSIDE_POSITION}px`,
                    top: `${OUTSIDE_POSITION}px`,
                });
            });
            setStyle({
                opacity: 0,
            });
        } else {
            setStyle({
                left: `${OUTSIDE_POSITION}px`,
                top: `${OUTSIDE_POSITION}px`,
                opacity: 0,
            });
        }

    }
}