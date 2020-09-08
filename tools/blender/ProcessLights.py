import bpy
for light in bpy.data.lights:
    light["castShadow"] = light.use_shadow
    light["shadowMapSize"] = light.shadow_buffer_size
for probe in bpy.data.lightprobes:
    print(probe.name)
    if probe.type == "GRID":
        print("is grid")
        probe["resolutionX"] = probe.grid_resolution_x
        probe["resolutionY"] = probe.grid_resolution_y
        probe["resolutionZ"] = probe.grid_resolution_z
        probe["clippingStart"] = probe.clip_start
        probe["clippingEnd"] = probe.clip_end