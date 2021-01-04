# Copy custom properties from active to selected bones

import bpy

def set_prop(ob, name, value):
    ob[name] = value
    
def getProps(ob):
    names = list(set(ob.keys()) - set(('cycles_visibility', '_RNA_UI')))
    values = [(name, ob[name]) for name in names]
    return values

context = bpy.context
armature = context.active_object
if armature and context.object.mode == 'EDIT':
    active = context.active_bone
    selected = context.selected_bones
    [[set_prop(ob, name, value) for (name, value) in getProps(active)] for ob in selected]
else:
    print("Error: can only work in EDIT mode")