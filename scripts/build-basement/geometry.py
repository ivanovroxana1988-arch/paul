"""Photo-grounded open industrial floor model (single 360 equirectangular panorama).
Y up. Geometry is an approximation; photos are used directly for floor, vaults and artworks.
"""
import os, math, numpy as np, cv2, trimesh
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter
from trimesh.visual.material import PBRMaterial
from trimesh.visual.texture import TextureVisuals

OUT='/mnt/data/subsol_paul_fidel_v3.glb'
SCENE=trimesh.Scene()
SRC='/mnt/data/subsol_reference_preview.jpg'
PAN=cv2.imread(SRC, cv2.IMREAD_COLOR)
PH,PW=PAN.shape[:2]
RNG=np.random.default_rng(31)
CAM=np.array([0.0,1.64,0.0])

# Convert (world position -> photo pano texel)
def pano_sample(X,Y,Z, out_size=None):
    X=np.asarray(X,dtype=np.float32);Y=np.asarray(Y,dtype=np.float32);Z=np.asarray(Z,dtype=np.float32)
    dx=X-CAM[0];dy=Y-CAM[1];dz=Z-CAM[2]
    r=np.sqrt(dx*dx+dy*dy+dz*dz)+1.e-5
    u=np.mod(.5+np.arctan2(dx, -dz)/(2*np.pi), 1.)
    v=np.clip(.5-np.arcsin(np.clip(dy/r,-1,1))/np.pi,0,1)
    pix=cv2.remap(PAN,np.float32(u*PW),np.float32(v*PH),cv2.INTER_LINEAR,borderMode=cv2.BORDER_WRAP)
    return Image.fromarray(cv2.cvtColor(pix,cv2.COLOR_BGR2RGB))

# Texture bake: sampling the attached 360 reference onto actual 3D floor and vaults.
N=2048
xs=np.linspace(-13.8,13.8,N,dtype=np.float32)
zs=np.linspace(-10.6,10.6,N,dtype=np.float32)
xx,zz=np.meshgrid(xs,zs)
# Photo-real floor, without the projected wall-paint smear that appears near the horizon.
# Base tile comes from a clean patch of actual concrete in the reference panorama.
base_tile=Image.open('/mnt/data/tile2.jpg').convert('RGB')
base_floor=Image.new('RGB',(N,N))
for yi in range(4):
    for xi in range(4):
        tile=base_tile.copy()
        if RNG.random()<0.5:tile=tile.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
        if RNG.random()<0.5:tile=tile.transpose(Image.Transpose.FLIP_TOP_BOTTOM)
        tile=tile.resize((N//4,N//4),Image.Resampling.BICUBIC)
        tile=ImageEnhance.Brightness(tile).enhance(float(RNG.uniform(.91,1.08)))
        base_floor.paste(tile,(xi*(N//4),yi*(N//4)))
# Blend the real central photo into a repeatable material rather than projecting a mural onto the floor.
projected=pano_sample(xx,0*xx,zz)
rad=np.sqrt(xx*xx+zz*zz)
mask=np.clip((5.25-rad)/2.2,0.0,1.0)
mask=(mask*mask*(3-2*mask))
base_np=np.asarray(base_floor).astype(np.float32)
proj_np=np.asarray(projected).astype(np.float32)
combine=base_np*(1-mask[...,None])+proj_np*mask[...,None]
floor_img=Image.fromarray(np.uint8(np.clip(combine,0,255)))
floor_img.save('/mnt/data/subsol_floor_photo_curat.jpg',quality=88,optimize=True)
# Concrete vault material taken from a nearly clean photograph region, rather than a distorted spherical reprojection.
ceiling_imgs=[]
for k in range(3):
    ceiling_imgs.append(Image.open('/mnt/data/ceiling_crop.jpg').convert('RGB').resize((1280,640),Image.Resampling.LANCZOS))

# From the photograph: murals, brick artwork, green awning
pim=Image.open(SRC).convert('RGB')
def crop_tex(box,size):
    return pim.crop(box).resize(size,Image.Resampling.LANCZOS)
# Two central mural sections, left (pink) and right (cyan), same panoramic reference
tex_pink_front=crop_tex((170,785,1100,1220),(1600,750))
tex_pink_side=crop_tex((1050,790,1450,1180),(750,750))
tex_cyan_front=crop_tex((2500,780,3290,1180),(1600,750))
tex_cyan_side=crop_tex((3200,780,3575,1200),(750,750))
tex_core=crop_tex((1530,550,2055,1130),(1000,1024))
tex_core_brick=crop_tex((2120,545,2370,1080),(512,1000))
tex_side_graff=crop_tex((3500,675,3910,1180),(720,850))
# color clean textures for structure and steel, informed by sampled photo palette

def weathered_brick(size=1024,seed=2):
    rand=np.random.default_rng(seed)
    h=w=size
    arr=np.zeros((h,w,3),dtype=np.float32)
    # smoked red brick, subdued and worn to match photo
    arr[:]=[105,73,62]
    noise=rand.normal(0,8,(h,w,1))
    arr += noise
    # scattered brick blocks and mortar jointing
    mortar=(119,101,89)
    brick_h=57;brick_w=142
    for row,y0 in enumerate(range(0,h+brick_h,brick_h)):
        ya=max(y0,0);yb=min(y0+brick_h,h)
        if ya>=h: break
        arr[ya:min(ya+3,h),:]=mortar
        offset=(brick_w//2 if row%2 else 0)
        for x0 in range(-brick_w+offset,w+brick_w,brick_w):
            xstart=max(x0,0); xend=min(x0+brick_w,w)
            if xstart>=xend:continue
            arr[ya+3:yb-2,xstart:xend]+=rand.normal(0,8)
            if 0 <= x0 < w:
                arr[ya:yb,x0:min(x0+3,w)]=mortar
    # dark gritty veiling
    yy=np.linspace(0,1,h)[:,None,None];arr=arr*(.91+0.08*np.cos(yy*8))
    return Image.fromarray(np.uint8(np.clip(arr,0,255)))

def steel_tex(size=512):
    h=w=size
    rs=np.random.default_rng(77)
    a=np.zeros((h,w,3),dtype=np.float32)
    a[:]=[103,79,71]
    a+=rs.normal(0,7,(h,w,1))
    # oxidation streaks
    for _ in range(100):
        x=rs.integers(0,w);y=rs.integers(0,h);width=rs.integers(1,8);height=rs.integers(7,110)
        c=np.array([155,83,59]) if rs.random()<.55 else np.array([67,70,67])
        sl=a[y:min(h,y+height),x:min(w,x+width)]
        sl[:]=.56*sl+.44*c
    return Image.fromarray(np.uint8(np.clip(a,0,255)))

tex_brick=weathered_brick()
tex_steel=steel_tex()
tex_floor_plain=crop_tex((3150,1310,4010,1860),(1024,768)) # backup concrete

def mat(name, img=None, color=None, rough=.9, metal=0.0):
    args=dict(name=name,roughnessFactor=rough,metallicFactor=metal,doubleSided=True)
    if img is not None: args['baseColorTexture']=img
    if color is not None:args['baseColorFactor']=color
    return PBRMaterial(**args)
M={
'floor':mat('01_Floor_photo',floor_img,rough=.96),
'concrete':mat('02_Shell_concrete',tex_floor_plain,rough=.96),
'brick':mat('03_Brick_aged',tex_brick,rough=.94),
'steel':mat('04_Rusted_steel',tex_steel,rough=.74,metal=.50),
'rail':mat('05_Railing_silver',color=[92,99,102,255],rough=.68,metal=.74),
'dark':mat('06_Grey_steel_sculpture',color=[65,68,70,255],rough=.76,metal=.42),
'green':mat('07_Green_awnings',color=[57,107,83,255],rough=.84,metal=.07),
'wood':mat('08_Wood_planks',color=[129,112,85,255],rough=.88),
'pink':mat('09_Pink_mural_original_photo',tex_pink_front,rough=.94),
'pink_side':mat('10_Pink_mural_side_original',tex_pink_side,rough=.94),
'cyan':mat('11_Cyan_mural_original_photo',tex_cyan_front,rough=.94),
'cyan_side':mat('12_Cyan_mural_side_original',tex_cyan_side,rough=.94),
'core':mat('13_Central_sculpture_original_photo',tex_core,rough=.92),
'core_brick':mat('14_Core_graffiti_brick_photo',tex_core_brick,rough=.93),
'side':mat('15_Right_side_graffiti_photo',tex_side_graff,rough=.95),
}
for i,tex in enumerate(ceiling_imgs): M['vault'+str(i)]=mat(f'16_Vault_{i}_photo_projected',tex,rough=.96)

# Generic layout methods. Y up, large opening bays kept transparent.
def add(name,mesh,material,uv=None):
    if uv is None:
        vertices=mesh.vertices
        p=np.array(vertices); minp=p.min(axis=0); maxp=p.max(axis=0)
        s=np.maximum(maxp-minp,.001)
        # default UV to provide material texture without a special projection
        uv=np.stack([(p[:,0]-minp[0])/s[0],(p[:,1]-minp[1])/s[1]],axis=1)
    mesh.visual=TextureVisuals(uv=np.array(uv,dtype=float),material=material)
    SCENE.add_geometry(mesh,geom_name=name,node_name=name)

def box(name,center,size,material):
    m=trimesh.creation.box(extents=size)
    m.apply_translation(center)
    add(name,m,material)

def surface(name,v,mat,tile=(1,1),reverse_v=False):
    mesh=trimesh.Trimesh(vertices=v,faces=[[0,1,2],[0,2,3]],process=False)
    u,v=tile
    uv=[[0,0],[u,0],[u,v],[0,v]]
    if reverse_v: uv=[[0,v],[u,v],[u,0],[0,0]]
    add(name,mesh,mat,uv)

def panel_xz(name,x0,x1,z0,z1,y,mat):
    surface(name,[[x0,y,z0],[x1,y,z0],[x1,y,z1],[x0,y,z1]],mat)

def panel_xy(name,x0,x1,y0,y1,z,mat):
    surface(name,[[x0,y0,z],[x1,y0,z],[x1,y1,z],[x0,y1,z]],mat,reverse_v=True)

def panel_zy(name,z0,z1,y0,y1,x,mat):
    surface(name,[[x,y0,z0],[x,y0,z1],[x,y1,z1],[x,y1,z0]],mat,reverse_v=True)

def tube(name, a, b, radius, material, sections=10):
    a=np.array(a,float);b=np.array(b,float);d=b-a;L=np.linalg.norm(d)
    if L < .001:return
    m=trimesh.creation.cylinder(radius=radius,height=L,sections=sections)
    m.apply_transform(trimesh.geometry.align_vectors([0,0,1],d/L));m.apply_translation((a+b)/2)
    add(name,m,material)

def beam(name,a,b,thickness,material):
    a=np.array(a,float);b=np.array(b,float);d=b-a;L=np.linalg.norm(d)
    if L<.001:return
    m=trimesh.creation.box(extents=(thickness[0],thickness[1],L))
    m.apply_transform(trimesh.geometry.align_vectors([0,0,1],d/L));m.apply_translation((a+b)/2)
    add(name,m,material)

# -----------------------------------------------------------------------
# 1 Floor: texture contains dirt, marks and light patches from panorama.
# -----------------------------------------------------------------------
box('FLOOR_collision_slab',(0,-.17,0),(27.6,.34,21.2),M['concrete'])
panel_xz('FLOOR_photo_projected',-13.8,13.8,-10.6,10.6,.012,M['floor'])
# outlines for control in Three.js; walking surface y=0

# 2 Vaulted ceiling: photo directly sampled at the same projected 3D positions.
#    All three bays are subtle low-rise, not high domes.
bays=[(-10.4,-3.45),(-3.45,3.45),(3.45,10.4)]
for i,(z0,z1) in enumerate(bays):
    vs=[];f=[];uv=[]
    NX=48;NZ=28
    for ix,x in enumerate(np.linspace(-13.6,13.6,NX)):
        for iz,z in enumerate(np.linspace(z0,z1,NZ)):
            t=(z-z0)/(z1-z0); y=4.68+1.0*math.sin(math.pi*t)
            vs.append((x,y,z)); uv.append((ix/(NX-1)*3.3,iz/(NZ-1)*1.4))
    for ix in range(NX-1):
        for iz in range(NZ-1):
            a=ix*NZ+iz;b=a+NZ;c=b+1;d=a+1
            f.extend([[a,b,c],[a,c,d]])
    m=trimesh.Trimesh(vertices=vs,faces=f,process=False)
    add(f'VAULT{i}_photo_mapped',m,M['vault'+str(i)],uv)
    # longitudinal steel ribs following the vaults on only selected bays
    for j,x in enumerate([-12.7,-6.4,0,6.4,12.7]):
        pts=[]
        for t in np.linspace(0,1,19):
            z=z0+(z1-z0)*t;y=4.67+1.02*np.sin(math.pi*t)
            pts.append((x,y-.05,z))
        for k,(a,b) in enumerate(zip(pts[:-1],pts[1:])):
            beam(f'VAULT_RIB_{i}_{j}_{k}',a,b,(.12,.22),M['steel'])

# 3 Photo's clear grid: 2 rows of posts span a mostly open roof, NOT a sealed basement.
for i,x in enumerate([-12.55,-6.35,0,6.35,12.55]):
    for j,z in enumerate([-7.0,0,7.0]):
        # slim dark red I-shaped columns; avoid unnecessary forest of 20 columns
        box(f'COLUMN_FLANGE_FRONT_{i}_{j}',(x,2.38,z),(0.29,4.76,.070),M['steel'])
        box(f'COLUMN_WEB_{i}_{j}',(x,2.38,z),(.08,4.76,.28),M['steel'])
        box(f'COLUMN_FLANGE_BACK_{i}_{j}',(x,2.38,z),(.29,4.76,.070),M['steel'])
        box(f'COLUMN_FOOT_{i}_{j}',(x,.10,z),(.42,.20,.42),M['steel'])
    # roof steel beam spans central axis
    beam(f'LONG_BEAM_{i}',(x,4.72,-10.4),(x,4.72,10.4),(.22,.25),M['steel'])
for j,z in enumerate([-10.35,-7,-3.45,0,3.45,7,10.35]):
    beam(f'CROSS_BEAM_{j}',(-13.5,4.72,z),(13.5,4.72,z),(.19,.21),M['steel'])

# 4 Peripheral brick fragments / open bays. No invented sealed external walls.
# Partially enclosed back-end fragment with spray-painted art, seen to yaw180.
box('BRICK_WALL_SECTION_RIGHT',(13.37,2.15,3.9),(.39,4.3,6.9),M['brick'])
panel_zy('RIGHT_END_GRAFFITI',0.9,5.95,.34,3.72,13.12,M['side'])
box('BRICK_WALL_SECTION_LEFT',(-13.37,2.15,-5.0),(.39,4.3,4.6),M['brick'])
# partial brick piers near openings, no fake glazing
for k,z in enumerate([-10.1,-4.85,4.85,10.1]):
    for side in [-1,1]:
        x=side*13.38
        box(f'FACADE_PIER_{side}_{k}',(x,2.3,z),(.45,4.6,.48),M['brick'])

# 5 Sculpture on the north side: actual photo art in gray steel with broken planar shapes.
# Behind the railing: old brick alcove and hand-wrought sculpture, not a plain black cube.
box('CORE_BRICK_BACK',(0,2.20,-6.7),(7.1,4.4,.36),M['brick'])
box('CORE_BRICK_LEFT',(-3.42,2.20,-5.45),(.38,4.4,2.8),M['brick'])
box('CORE_BRICK_RIGHT',(3.42,2.20,-5.45),(.38,4.4,2.8),M['brick'])
panel_zy('CORE_BRICK_ART_RIGHT',-6.32,-4.72,.5,3.95,3.20,M['core_brick'])
# photoreal sculptural composition on true XY surface
panel_xy('CORE_SCULPTURE_PHOTO',-2.75,2.25,.55,4.14,-6.46,M['core'])
# raised faceted fragments and void-like folds in front for actual relief when orbiting
fragments=[(-1.18,2.9,-6.14,.87,.26,.52),(-.45,3.26,-6.11,.55,.22,.42),
           (.6,2.62,-6.14,.99,.14,.71),(1.4,3.42,-6.10,.65,.17,.39),
           (-.70,1.55,-6.12,.60,.19,.76),(.25,1.18,-6.13,.64,.18,.90)]
for i,(x,y,z,sx,sy,sz) in enumerate(fragments):
    m=trimesh.creation.box(extents=(sx,sy,sz))
    m.apply_transform(trimesh.transformations.rotation_matrix(.19*(i-2),[0,0,1]))
    m.apply_translation((x,y,z));add(f'CORE_FRAGMENT_{i}',m,M['dark'])
# green canopy band in front, visible in panorama above sculpture
box('CORE_GREEN_CANOPY',(0,4.28,-4.55),(6.45,.16,2.30),M['green'])
box('CORE_CANOPY_TRIM',(0,4.23,-3.41),(6.45,.065,.10),M['steel'])
# railing in front of this core, thin horizontal and vertical bars
for i,x in enumerate(np.linspace(-3.1,4.7,18)):
    tube(f'CORE_GUARD_POST_{i}',(x,.10,-3.55),(x,1.2,-3.55),.026,M['rail'],sections=8)
for h in [.33,.71,1.2]:
    tube(f'CORE_GUARD_HORIZONTAL_{h}',(-3.3,h,-3.55),(4.86,h,-3.55),.026,M['rail'],sections=8)

# 6 Cyan and pink mural surfaces to the east/west. Both are corner installations.
# Pink left foreground: L-shaped wall, with actual graffiti crop not a photo on every wall.
box('MURAL_PINK_WEST_STRUCTURE',(-6.4,1.21,-.30),(.24,2.42,6.8),M['dark'])
panel_zy('MURAL_PINK_FRONT_PHOTO',-3.65,3.05,.13,2.33,-6.24,M['pink'])
box('MURAL_PINK_CORNER_RETURN',(-5.55,1.21,-3.63),(1.96,2.42,.22),M['dark'])
panel_xy('MURAL_PINK_SIDE_PHOTO',-6.27,-4.59,.10,2.30,-3.50,M['pink_side'])
# Cyan artwork to east, central panels as shown in source view yaw90
box('MURAL_CYAN_EAST_STRUCTURE',(6.20,1.28,-.12),(.24,2.56,7.30),M['dark'])
panel_zy('MURAL_CYAN_FRONT_PHOTO',-3.69,3.45,.12,2.43,6.04,M['cyan'])
box('MURAL_CYAN_CORNER_RETURN',(5.35,1.28,-3.78),(1.9,2.56,.22),M['dark'])
panel_xy('MURAL_CYAN_SIDE_PHOTO',4.45,6.15,.12,2.43,-3.67,M['cyan_side'])

# 7 Rails along open exterior roof edges and additional slim glazing-free steel frame.
# The original shows open daylight and metal guardrails.
for side in [-1,1]:
    x=side*13.13
    for z in np.arange(-10.0,10.2,1.0):
        # leave actual wall pieces with rail behind/around openings
        if side==1 and .5<z<7.5:continue
        tube(f'EDGE_POST_{side}_{z:.1f}',(x,.06,z),(x,1.22,z),.025,M['rail'],sections=7)
    for h in [.5,1.15]:
        tube(f'EDGE_RAIL_{side}_{h}',(x,h,-10.1),(x,h,10.1),.03,M['rail'],sections=7)

# 8 Physical objects grounded by photo (distinct from printed wall murals).
# Wood palette on floor, small green slatted bench beside the cyan mural.
box('PALLET_BED',(-2.65,.09,5.00),(2.00,.18,1.02),M['wood'])
for n,z in enumerate(np.linspace(4.58,5.42,5)):
    box(f'PALLET_PLANK_{n}',(-2.65,.2,z),(2.08,.075,.15),M['wood'])
for n,z in enumerate([-0.6,0.0,0.6]):
    box(f'GREEN_BENCH_SLAT_{n}',(8.2,.35+(.14*n),1.6+z/3),(4.3,.075,.24),M['green'])
for z in [1.0,2.1]:
    box(f'GREEN_BENCH_LEG_{z}',(8.2,.18,z),(.12,.36,.14),M['wood'])
# loose boards seen on photograph
for i,(x,z,a) in enumerate([(0.3,6.8,-.28),(1.7,6.5,.23)]):
    m=trimesh.creation.box(extents=(2.8 if i==0 else 1.65,.055,.095))
    m.apply_transform(trimesh.transformations.rotation_matrix(a,[0,1,0]));m.apply_translation([x,.043,z]);add(f'LOOSE_BOARD_{i}',m,M['wood'])

# Metadata: source and intent. Geometry structure is editable in generated script.
SCENE.metadata['source_image']='subsol_reference_preview.jpg / teufelsberg_inner_4k.exr'
SCENE.metadata['camera_approx']='[0, 1.64, 0] world Y-up'
SCENE.metadata['limitations']='single-view reconstructed proxy; real hidden dimensions not recoverable'
# Position core/sail sculpture a little to the left of camera's forward bearing,
# following the photographic view where the skylight is to the right.
for mesh_name,geo in SCENE.geometry.items():
    if mesh_name.startswith('CORE_'):
        geo.apply_translation([-2.0, 0, 0])
SCENE.export(OUT)
print('EXPORT',OUT,'SIZE_MB',round(os.path.getsize(OUT)/1e6,2),'MESHES',len(SCENE.geometry),'BOUNDS',SCENE.bounds)