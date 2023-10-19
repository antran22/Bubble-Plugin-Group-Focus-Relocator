function(instance, properties, context) {
    const referenceEl = document.getElementById(properties.reference_element_id);
    const groupFocusEl = document.getElementById(instance.data.groupFocusId);
    instance.data.runCleanup();

    if (!referenceEl || !groupFocusEl) {
        context.reportDebugger("Cannot find Reference or Group Focus Element, exiting");
        return;
    }
    
    const baseProperties = instance.data.baseProperties;
    const middleware = [];
    
    if (baseProperties.offset_main_axis || baseProperties.offset_cross_axis) {
        middleware.push(FloatingUIDOM.offset({
            mainAxis: baseProperties.offset_main_axis,
            crossAxis: baseProperties.offset_cross_axis,
        }));
    }
    
    const placementOptimizer = baseProperties.placement_optimizer;
    const shiftType = baseProperties.shift_type;

    let boundary = "clippingAncestors";
    if (placementOptimizer !== "None" || shiftType != "None") {
        let clippingParent = null;
        if (properties.clipping_parent_id) {
            clippingParent = document.getElementById(properties.clipping_parent_id);
        }

        if (clippingParent) {
            boundary = clippingParent;
        } else {
            boundary = referenceEl.closest(".RepeatingGroup") || boundary;
        }
    }
    

    if (placementOptimizer === "Flip") {
        middleware.push(FloatingUIDOM.flip({
            boundary: boundary,
        }));
    } 
    
    if (placementOptimizer === "Auto Placement") {
        middleware.push(FloatingUIDOM.autoPlacement({
            boundary: boundary,
        }));
    }
    
    if (shiftType !== "None") {
        middleware.push(FloatingUIDOM.shift({
            boundary: boundary,
            crossAxis: shiftType === "Agressive Shift",
        }));
    }

    let checkReferenceHidden = false;
    let checkEscaped = false;
    if (baseProperties.hide === "Group Focus escaped" || baseProperties.hide === "Both") {
        checkEscaped = true;
        middleware.push(
            FloatingUIDOM.hide({strategy: "escaped"})
        );
    }

    if (baseProperties.hide === "Reference hidden" || baseProperties.hide === "Both") {
        checkReferenceHidden = true;
        middleware.push(
            FloatingUIDOM.hide({strategy: "referenceHidden"})
        );
    }
    
    let lastPlacement = null;
    let lastHide = true;


    async function updatePosition() {
        const {x, y, middlewareData, placement} = await FloatingUIDOM.computePosition(referenceEl, groupFocusEl, {
            middleware,
            placement: baseProperties.placement || "bottom-end",
        });

        const hide = middlewareData.hide;

        const shouldHide = (checkReferenceHidden && hide.referenceHidden) || (checkEscaped && hide.escaped);
        const transitionProperties = [];
        if (baseProperties.animate_appearance && lastHide !== shouldHide ) {
            transitionProperties.push("opacity")
        }
        
        lastHide = shouldHide;
        
        
		if (
            baseProperties.animate_placement && 
            !shouldHide && 
            lastPlacement !== null && 
            placement !== lastPlacement
        ) {
            transitionProperties.push("left");
            transitionProperties.push("top");
        }
        
        instance.data.applyTransition(200, transitionProperties);
        
        if (shouldHide) {
            lastPlacement = null;
        } else {
            lastPlacement = placement;
        }

        instance.data.setStyle({
            opacity: shouldHide ? 0 : 1,
            left: `${x}px`,
            top: `${y}px`,
        });
    }
    if (baseProperties.follow_position) {
        instance.data._cleanupFunc = FloatingUIDOM.autoUpdate(
            referenceEl,
            groupFocusEl,
            updatePosition
        );
    } else {
        updatePosition();
    }
    instance.data.watchHiddenEvent(groupFocusEl);
}