#!/usr/bin/env python3
"""Rebuild Paul's basement GLB from the freely-licensed Teufelsberg Inner panorama.

Inputs: scripts/build-basement/geometry.py and adapt.py from the Paul repo.
Output: assets/subsol_paul_geam_parter_v4_web.glb

The build is deterministic for the same panorama, preserves the PIT cut-out,
and reuses the site's existing glass floor and staircase.
"""
from __future__ import annotations
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import urllib.request
from PIL import Image
import trimesh

ROOT = Path(__file__).resolve().parents[2] if Path(__file__).name == 'build.py' else Path(__file__).resolve().parent
BASE = Path(__file__).resolve().parent
GLB_NAME = 'subsol_paul_geam_parter_v4_web.glb'


def fetch_panorama(output: Path):
    # The public Poly Haven API provides an authoritative URL and is attributed
    # below.  It is not called from visitors' browsers, only during the build.
    req = urllib.request.Request('https://api.polyhaven.com/files/teufelsberg_inner', headers={
      'User-Agent': 'PaulsArtspace-BasementBuilder/1.0 (3D-site asset preparation)',
      'Accept': 'application/json',
    })
    with urllib.request.urlopen(req, timeout=45) as response:
        links = json.load(response)
    source_url = links['tonemapped']['url']
    source_req = urllib.request.Request(source_url, headers={'User-Agent': 'PaulsArtspace-BasementBuilder/1.0'})
    with urllib.request.urlopen(source_req, timeout=120) as response:
        raw = response.read()
    if len(raw) < 100000:
        raise RuntimeError(f'Panorama image unexpectedly small ({len(raw)} bytes)')
    from io import BytesIO
    im = Image.open(BytesIO(raw)).convert('RGB')
    if im.width / im.height < 1.95 or im.width / im.height > 2.05:
        raise RuntimeError('Expected an equirectangular 2:1 panorama')
    im.resize((4096, 2048), Image.Resampling.LANCZOS).save(output, quality=92)
    print('Panorama source: https://polyhaven.com/a/teufelsberg_inner (CC0; Greg Zaal)')


def make_crops(base: Path):
    im = Image.open(base / 'subsol_reference_preview.jpg').convert('RGB')
    # Repeatable concrete patch from the real floor. Avoid mural regions.
    im.crop((2450, 1400, 3050, 1910)).resize((640,512),Image.Resampling.LANCZOS).save(base/'tile2.jpg', quality=91)
    im.crop((1010,20,1770,360)).save(base/'ceiling_crop.jpg', quality=91)


def run_legacy_code(source_path: Path, temp: Path):
    # Original authoring scripts use /mnt/data as a scratch directory. Never
    # write there on GitHub Actions; map to temporary build folder instead.
    script = source_path.read_text().replace('/mnt/data', str(temp))
    destination = temp / source_path.name
    destination.write_text(script)
    subprocess.run([sys.executable, str(destination)], check=True)


def optimize(src: Path, dst: Path):
    scene = trimesh.load(str(src),force='scene')
    from PIL import Image
    seen = set()
    for geo in scene.geometry.values():
        mat = getattr(getattr(geo, 'visual', None), 'material', None)
        if mat is None or id(mat) in seen:
            continue
        seen.add(id(mat))
        img = getattr(mat, 'baseColorTexture', None)
        if img is None:
            continue
        img = img.convert('RGB')
        if max(img.size) > 1280:
            scale = 1280 / max(img.size)
            img = img.resize((max(1,int(img.width*scale)), max(1,int(img.height*scale))), Image.Resampling.LANCZOS)
        mat.baseColorTexture = img
    scene.export(str(dst))
    return scene


def validate(scene):
    # The transparent glass occupies X [-6.2,5.4], Z [6.2,12.5], Y ~0.
    # The stair occupies X [-9.6,-6.2]. Both require a real roof void.
    pit = (-9.6, 5.4, 6.2, 12.5)
    roof_names = ('ROOF_VAULT', 'ROOF_RIB', 'ROOF_LONG_BEAM', 'ROOF_CROSS_BEAM')
    for name, geo in scene.geometry.items():
        if not name.startswith(roof_names):
            continue
        tris = geo.vertices[geo.faces]
        center = tris.mean(axis=1)
        bad = (center[:,0]>pit[0]+.04)&(center[:,0]<pit[1]-.04)&(center[:,2]>pit[2]+.04)&(center[:,2]<pit[3]-.04)
        if bad.any():
            raise AssertionError(f'Roof blocks view through the glass: {name}')
        if geo.bounds[1,1] -4.2 >= -.7:
            raise AssertionError(f'Roof intersects ground-floor slab: {name}')
    if len(scene.geometry) < 120:
        raise AssertionError(f'Basement has unexpectedly few objects: {len(scene.geometry)}')
    print(f'Validated {len(scene.geometry)} GLB geometries, roof clearance and staircase aperture')


def main():
    root = ROOT
    scripts = BASE
    if not (scripts/'geometry.py').exists() or not (scripts/'adapt.py').exists():
        # Allow local execution when the source files still have their original names.
        scripts = Path('/mnt/data')
    with tempfile.TemporaryDirectory(prefix='paul-basement-') as tmp:
        build_dir = Path(tmp)
        input_image = build_dir/'subsol_reference_preview.jpg'
        local_reference = os.environ.get('PAUL_BASEMENT_PANO')
        if local_reference:
            Image.open(local_reference).convert('RGB').resize((4096,2048)).save(input_image,quality=92)
        else:
            fetch_panorama(input_image)
        make_crops(build_dir)
        geometry_script = scripts/'geometry.py' if (scripts/'geometry.py').exists() else scripts/'subsol_paul_fidel.py'
        adapt_script = scripts/'adapt.py' if (scripts/'adapt.py').exists() else scripts/'adapteaza_subsol_geam.py'
        run_legacy_code(geometry_script, build_dir)
        run_legacy_code(adapt_script, build_dir)
        src = build_dir/'subsol_paul_geam_parter_v4.glb'
        target = root/'assets'/GLB_NAME
        target.parent.mkdir(exist_ok=True, parents=True)
        scene=optimize(src,target)
        validate(scene)
        print('Finished:',target,'bytes',target.stat().st_size)


if __name__ == '__main__':
    main()