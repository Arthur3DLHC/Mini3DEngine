import bpy

# copy instace group custom property from active object to all selected objects
# https://blender.stackexchange.com/questions/24001/copy-custom-properties-from-one-object-to-another

ob_sel = bpy.context.selected_editable_objects
ob_act = bpy.context.object

try:
    instGrp = ob_act["instanceGroup"]
except KeyError:
    pass
else:
    for ob in ob_sel:
        if ob == ob_act:
            continue
        ob["instanceGroup"] = instGrp