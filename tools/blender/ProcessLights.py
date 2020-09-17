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
        if probe.type == "GRID":
            print("processing irradiance volume: " + obj.name)
            obj["extType"] = "irradianceVolume"
            obj["resolutionX"] = probe.grid_resolution_x
            obj["resolutionY"] = probe.grid_resolution_z    # swap y and z ?
            obj["resolutionZ"] = probe.grid_resolution_y
            obj["clippingStart"] = probe.clip_start
            obj["clippingEnd"] = probe.clip_end

# =====================================
# functions for get values from material nodes
    
def get_socket(mtl, name):
    """
    For a given material input name, retrieve the corresponding node tree socket.
    from github repository glTf-Blender-IO

    :param blender_material: a blender material for which to get the socket
    :param name: the name of the socket
    :return: a blender NodeSocket
    """
    if mtl.node_tree and mtl.use_nodes:
        type = bpy.types.ShaderNodeBsdfPrincipled
        nodes = [n for n in mtl.node_tree.nodes if isinstance(n, type)]
        inputs = sum([[input for input in node.inputs if input.name == name] for node in nodes], [])
        if inputs:
            return inputs[0]
    return None

def __previous_node(socket):
    while True:
        if not socket.is_linked:
            return None

        node = socket.links[0].from_node

        # Skip over reroute nodes
        if node.type == 'REROUTE':
            socket = node.inputs[0]
            continue

        return node

def __get_const_from_socket(socket, kind):
    if not socket.is_linked:
        if kind == 'RGB':
            if socket.type != 'RGBA': return None
            return list(socket.default_value)[:3]
        if kind == 'VALUE':
            if socket.type != 'VALUE': return None
            return socket.default_value

    # Handle connection to a constant RGB/Value node
    prev_node = __previous_node(socket)
    if prev_node is not None:
        if kind == 'RGB' and prev_node.type == 'RGB':
            return list(prev_node.outputs[0].default_value)[:3]
        if kind == 'VALUE' and prev_node.type == 'VALUE':
            return prev_node.outputs[0].default_value

    return None

def get_factor_from_socket(socket, kind):
    """
    For baseColorFactor, metallicFactor, etc.
    Get a constant value from a socket, or a constant value
    from a MULTIPLY node just before the socket.
    kind is either 'RGB' or 'VALUE'.
    """
    fac = __get_const_from_socket(socket, kind)
    if fac is not None:
        return fac

    node = __previous_node(socket)
    if node is not None:
        x1, x2 = None, None
        if kind == 'RGB':
            if node.type == 'MIX_RGB' and node.blend_type == 'MULTIPLY':
                # TODO: handle factor in inputs[0]?
                x1 = __get_const_from_socket(node.inputs[1], kind)
                x2 = __get_const_from_socket(node.inputs[2], kind)
        if kind == 'VALUE':
            if node.type == 'MATH' and node.operation == 'MULTIPLY':
                x1 = __get_const_from_socket(node.inputs[0], kind)
                x2 = __get_const_from_socket(node.inputs[1], kind)
        if x1 is not None and x2 is None: return x1
        if x2 is not None and x1 is None: return x2

    return None

# =====================================
# process materials

for mtl in bpy.data.materials:
    specular_socket = get_socket(mtl, "Specular")
    if isinstance(specular_socket, bpy.types.NodeSocket):
        fac = get_factor_from_socket(specular_socket, kind='VALUE')
        mtl["specular"] = fac