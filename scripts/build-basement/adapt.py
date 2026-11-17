"""Prepare Paul Artspace basement GLB for existing first-floor glass opening.

Ground truth from Paul repo `levels.js` on 2026-11-17:
PIT = x[-9.6,5.4], z[6.2,12.5], Y floor=-4.2.
Glass proper is x[-6.2,5.4], the rest of PIT is an open stair.

This file makes a geometry-level void (not transparency), removes intersecting
roof ribs/posts, keeps the glass + frame ONLY in the site, and avoids duplicating
the site's basement floor slab. All geometry remains in local Y-up coordinates;
set model.position.y = -4.2 when imported into world.js.
"""
import math, os, json
import numpy as np
import trimesh
from trimesh.visual.texture import TextureVisuals

SOURCE='/mnt/data/subsol_paul_fidel_v3.glb'
OUTPUT='/mnt/data/subsol_paul_geam_parter_v4.glb'
MANIFEST='/mnt/data/subsol_paul_geam_parter_v4.json'

PIT={'left':-9.6,'right':5.4,'far':6.2,'near':12.5,
     'stairRight':-6.2,'depth':4.2}
HOLE={'left':-9.68,'right':5.48,'far':6.12,'near':12.58}
Y_SCALE=0.60
MODEL_SITE_Y=-PIT['depth']

old=trimesh.load(SOURCE, force='scene')
new=trimesh.Scene()

# Material instances and photo crops are kept directly from the previous GLB.
materials={}
for name,g in old.geometry.items():
    if hasattr(g.visual,'material'):
        materials[name]=g.visual.material

def add(name, g):
    new.add_geometry(g, geom_name=name, node_name=name)

def add_box(name, bounds, mat):
    (x0,y0,z0),(x1,y1,z1)=bounds
    mesh=trimesh.creation.box(extents=[x1-x0,y1-y0,z1-z0])
    mesh.apply_translation([(x0+x1)/2,(y0+y1)/2,(z0+z1)/2])
    vv=mesh.vertices
    # UVs used only for textured metal; color is inherited from source.
    d=np.maximum(vv.max(axis=0)-vv.min(axis=0),1e-6)
    uv=np.stack([(vv[:,0]-vv[:,0].min())/d[0],(vv[:,2]-vv[:,2].min())/d[2]],axis=1)
    mesh.visual=TextureVisuals(uv=uv,material=mat)
    add(name,mesh)

def xy_overlap(a,b, axis=0):
    return a[0,axis] < b[1,axis] and a[1,axis] > b[0,axis]

def intersects_hole(g):
    b=g.bounds
    return b[0,0] < HOLE['right'] and b[1,0] > HOLE['left'] and b[0,2] < HOLE['near'] and b[1,2] > HOLE['far']

# 1. Preserve art and detail from photo. Remove and rebuild roof and structural
# beams so none passes through the window/stairs. Avoid duplicated solid slab.
removed=[]
for name,g in old.geometry.items():
    if name.startswith(('VAULT','LONG_BEAM_','CROSS_BEAM_')) or name in ('FLOOR_collision_slab','FLOOR_photo_projected'):
        removed.append(name); continue
    if name.startswith('COLUMN_') and intersects_hole(g):
        removed.append(name); continue
    gg=g.copy()
    gg.apply_scale([1,Y_SCALE,1])
    add(name,gg)

# 2. Photo-textured floor extends beyond the near edge of the glass, into the
# lower-floor footprint. It's a thin visual skin 2.5cm above the existing site
# slab, which we do NOT recreate inside its bounding box.
mat_floor=materials['FLOOR_photo_projected']
floor=trimesh.Trimesh(
    vertices=[[-13.8,.025,-10.6],[13.8,.025,-10.6],[13.8,.025,13.5],[-13.8,.025,13.5]],
    faces=[[0,1,2],[0,2,3]],process=False)
floor.visual=TextureVisuals(uv=[[0,0],[1,0],[1,1],[0,1]],material=mat_floor)
add('FLOOR_photo_overlay_site_aligned',floor)

# Site lower-floor: world x[-11.5,7.5], z[4.1,14.1], y[-4.65,-4.2]
# No physical slab within this volume. Only three residual peripheral pieces.
mat_concrete=materials['FLOOR_collision_slab']
FLOOR_BOTTOM=-.34*Y_SCALE
for name, b in [
 ('FLOOR_slab_south', [(-13.8,FLOOR_BOTTOM,-10.6),(13.8,0,4.1)]),
 ('FLOOR_slab_west',  [(-13.8,FLOOR_BOTTOM,4.1),(-11.5,0,13.5)]),
 ('FLOOR_slab_east',  [(7.5,FLOOR_BOTTOM,4.1),(13.8,0,13.5)])
]:
    add_box(name,b,mat_concrete)

# 3. Ceiling as three textured low vaults. The entire pit rectangle has NO
# roof geometry at all. Slight expansion gives a clean visual gap at the edge.
# Height: original vault 4.68...5.68 m *0.60 => 2.808...3.408 m local.
# In the site, ceiling peak <= y=-0.792, i.e. BELOW the parter slab underside -0.7.
bays=[(-10.4,-3.45),(-3.45,3.45),(3.45,13.4)]
for bay_idx,(z0,z1) in enumerate(bays):
    # Split EXACTLY at opening corners so the holes are crisp, not stair-stepped.
    xgrid=sorted(set(np.round(np.concatenate([np.linspace(-13.6,13.6,81),[HOLE['left'],HOLE['right']]]),5)))
    zgrid=sorted(set(np.round(np.concatenate([np.linspace(z0,z1,61),[zz for zz in (HOLE['far'],HOLE['near']) if z0<zz<z1]]),5)))
    # Separate vertices per quad to preserve piecewise UVs and avoid invisible
    # triangles spanning a hole after the geometry is indexed.
    verts=[];uvs=[];faces=[]
    for i in range(len(xgrid)-1):
        for j in range(len(zgrid)-1):
            xa,xb=xgrid[i:i+2];za,zb=zgrid[j:j+2]
            xm=(xa+xb)/2;zm=(za+zb)/2
            if (HOLE['left']<xm<HOLE['right'] and HOLE['far']<zm<HOLE['near']):
                continue
            base=len(verts)
            for x,z in ((xa,za),(xb,za),(xb,zb),(xa,zb)):
                t=(z-z0)/(z1-z0)
                y=Y_SCALE*(4.68+math.sin(math.pi*t))
                verts.append([x,y,z])
                uvs.append([(x+13.6)/27.2*3.3, t*1.4])
            faces.append([base,base+1,base+2]);faces.append([base,base+2,base+3])
    roof=trimesh.Trimesh(vertices=verts,faces=faces,process=False)
    roof.visual=TextureVisuals(uv=uvs,material=materials[f'VAULT{bay_idx}_photo_mapped'])
    add(f'ROOF_VAULT_{bay_idx}_CUT_FOR_PIT',roof)

# 4. Steel ribs follow the arches but stop at the roof opening.
mat_steel=materials['LONG_BEAM_0']
for b,(z0,z1) in enumerate(bays):
    for k,x in enumerate([-12.7,-6.4,0,6.4,12.7]):
        # Split the steel exactly at the edges of the cutout.
        ts=sorted(set(np.concatenate([np.linspace(0,1,53),[(zcut-z0)/(z1-z0) for zcut in (HOLE['far'], HOLE['near']) if z0<zcut<z1]])))
        parts=[]
        for j in range(len(ts)-1):
            t0,t1=ts[j],ts[j+1]
            z=z0+(t0+t1)/2*(z1-z0)
            if HOLE['left']<x<HOLE['right'] and HOLE['far']<z<HOLE['near']:
                continue
            def p(t):
                return [x,Y_SCALE*(4.67+1.02*math.sin(math.pi*t)-.05),z0+t*(z1-z0)]
            v0,v1=np.array(p(t0)),np.array(p(t1))
            a,bvec=v0,v1-v0
            length=np.linalg.norm(bvec)
            mesh=trimesh.creation.box(extents=[.12,Y_SCALE*.22,length])
            mesh.apply_transform(trimesh.geometry.align_vectors([0,0,1],bvec/length))
            mesh.apply_translation((v0+v1)/2)
            uv=np.zeros((len(mesh.vertices),2))
            mesh.visual=TextureVisuals(uv=uv, material=mat_steel)
            parts.append(mesh)
        if parts:
            joined=trimesh.util.concatenate(parts)
            joined.visual=TextureVisuals(uv=np.zeros((len(joined.vertices),2)), material=mat_steel)
            add(f'ROOF_RIB_{b}_{k}',joined)

# 5. Structural beams: split *outside* the full PIT so no bar crosses the pane.
# All beams end before the architectural glass opening; glass frame remains site-owned.
for i,x in enumerate([-12.55,-6.35,0,6.35,12.55]):
    intervals=[(-10.4,13.4)]
    if HOLE['left']<=x<=HOLE['right']:
        intervals=[(-10.4,HOLE['far']), (HOLE['near'],13.4)]
    for j,(za,zb) in enumerate(intervals):
        add_box(f'ROOF_LONG_BEAM_{i}_{j}',
            [(x-.11,Y_SCALE*4.595,za),(x+.11,Y_SCALE*4.845,zb)],mat_steel)

for i,z in enumerate([-10.35,-7,-3.45,0,3.45,7,10.35,13.15]):
    intervals=[(-13.5,13.5)]
    if HOLE['far']<=z<=HOLE['near']:
        intervals=[(-13.5,HOLE['left']), (HOLE['right'],13.5)]
    for j,(xa,xb) in enumerate(intervals):
        add_box(f'ROOF_CROSS_BEAM_{i}_{j}',
            [(xa,Y_SCALE*4.615,z-.095),(xb,Y_SCALE*4.825,z+.095)],mat_steel)

# 6. Explicit spatial verification against the actual site in world coords.
assert np.isclose(MODEL_SITE_Y,-4.2)
roof_objs=[(n,g) for n,g in new.geometry.items() if n.startswith(('ROOF_VAULT','ROOF_RIB','ROOF_LONG_BEAM','ROOF_CROSS_BEAM'))]
roof_peaks=[]
for n,g in roof_objs:
    bb=g.bounds
    roof_peaks.append(float(bb[1,1] + MODEL_SITE_Y))
    if intersects_hole(g):
        # Bounding boxes at the opening edge may touch it infinitesimally;
        # only an actual triangle/midpoint strictly inside would violate.
        vs=g.vertices; fs=g.faces
        tri=vs[fs].mean(axis=1)
        in_h=(tri[:,0]>PIT['left']+.035)&(tri[:,0]<PIT['right']-.035)&(tri[:,2]>PIT['far']+.035)&(tri[:,2]<PIT['near']-.035)
        if in_h.any():
            raise AssertionError(f'roof occludes opening: {n}, {tri[in_h][:2]}')
assert max(roof_peaks)<-.7, f'ceiling intersects parter slab: {max(roof_peaks)}'

# Detect structural posts in full stair or glass opening and guard against regressions.
for n,g in new.geometry.items():
    if n.startswith(('COLUMN_','ROOF_')) and intersects_hole(g):
        # Roof edge meshes are allowed as long as they do not enter the interior.
        if n.startswith('COLUMN_'): raise AssertionError(f'Post under glass/stair: {n}')

new.metadata['source']='subsol_paul_fidel_v3.glb + Paul GitHub levels.js geometry'
new.metadata['site_position']={'x':0,'y':MODEL_SITE_Y,'z':0}
new.metadata['void_local_xyz']={'x':[PIT['left'],PIT['right']],'z':[PIT['far'],PIT['near']]}
new.metadata['note']='NO glass meshes inside GLB. Site levels.js owns glazing, floor frame, stairs and local light.'
new.export(OUTPUT)

manifest={
 'asset':'subsol_paul_geam_parter_v4.glb',
 'coordinate_system':'right-handed, Y up, meters',
 'placement':{'x':0,'y':-4.2,'z':0,'scale':1},
 'site_source':'levels.js, PIT; read on 2026-11-17',
 'pit_bounds':{'x':[-9.6,5.4],'z':[6.2,12.5],'y_floor':-4.2,'y_ground':0},
 'glass_bounds':{'x':[-6.2,5.4],'z':[6.2,12.5],'y_center':-.05,'y_thickness':.1},
 'stair_bounds':{'x':[-9.6,-6.2],'z':[6.2,12.5]},
 'roof_clearance':'all ceiling vertices below y=-0.7 in site; no roof mesh across entire PIT',
 'floor':'only thin textured overlay atop site lower-floor; GLB slab absent from lower-floor volume',
 'no_duplicate_site_elements':['walkable-glass-floor','glass-floor-flush-frame','stair-*','lower-floor'],
 'comparison_source':'single 360 panorama, approximate structure and dimensions',
 'roof_max_world_y':round(max(roof_peaks),3),
 'geometry_count':len(new.geometry),
 'file_size_mb':round(os.path.getsize(OUTPUT)/1e6,2),
}
with open(MANIFEST,'w') as f:json.dump(manifest,f,indent=2,ensure_ascii=False)
print(json.dumps(manifest,ensure_ascii=False,indent=2))