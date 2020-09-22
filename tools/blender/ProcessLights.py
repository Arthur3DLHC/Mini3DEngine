import bpy

# in blender, there are 'objects' and their 'datas'
# only some data types can hold custom properties, such as lights

for light in bpy.data.lights:
    print("processing light: " + light.name)
    light["castShadow"] = light.use_shadow
    light["shadowMapSize"] = light.shadow_buffer_size
    light["shadowBias"] = light.shadow_buffer_bias
    if light.type == "SUN":
        light["shadowDistance"] = light.shadow_cascade_max_distance
        
    
# for lightprobes, the data object can not hold custom properties
# so you need to hold them on the object using the data object

for obj in bpy.data.objects:
    if obj.type == "LIGHT_PROBE":
        probe = obj.data
        obj["clippingStart"] = probe.clip_start
        obj["clippingEnd"] = probe.clip_end
        obj["radius"] = probe.influence_distance
        if probe.type == "CUBEMAP":
            print("processing cubemap probe: " + obj.name)
            obj["extType"] = "environmentProbe"
        elif probe.type == "GRID":
            print("processing irradiance volume: " + obj.name)
            obj["extType"] = "irradianceVolume"
            obj["resolutionX"] = probe.grid_resolution_x
            obj["resolutionY"] = probe.grid_resolution_z    # swap y and z ?
            obj["resolutionZ"] = probe.grid_resolution_y


