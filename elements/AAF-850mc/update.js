function(instance, properties, context) {
    instance.data.baseProperties = properties;
    if (instance.data.groupFocusId !== properties.group_focus_id) {    
        instance.data.groupFocusId = properties.group_focus_id;
        if (instance.data.loadElementStyle) {
            instance.data.loadElementStyle();
        }
    }
}