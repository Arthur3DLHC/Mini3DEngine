# Copy custom properties from active to selected objects

import bpy

def set_prop(ob, name, value):
    ob[name] = value
    
def getProps(ob):
    names = list(set(ob.keys()) - set(('cycles_visibility', '_RNA_UI')))
    values = [(name, ob[name]) for name in names]
    return values

active = bpy.context.active_object
selected = bpy.context.selected_objects
[[set_prop(ob, name, value) for (name, value) in getProps(active)] for ob in selected]