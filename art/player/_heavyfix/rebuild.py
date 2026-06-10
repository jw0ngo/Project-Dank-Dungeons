"""Re-cut playerheavy with the clipped E/W rear foot recovered.
Preserves body pixel scale + feet baseline of the shipped 192 sheet; only the
frame is widened (192->208) uniformly so E/W's foot (true fig ~202px wide) fits.
Non-clipped facings reproduce shipped body pixels at the same scale, just on the
wider canvas. mult must scale 192->208 (1.083x) to keep on-screen body size."""
from PIL import Image, ImageFilter
import numpy as np
from collections import deque
import os

SRC='art/player/warrior-heavy-attack.png'
OUTDIR='art/player/_heavyfix/out'
os.makedirs(OUTDIR, exist_ok=True)
NEW=208
OLD_FRAME=192
OLD_FEETY=187            # shipped feet baseline in 192 frame
FEETY=round(OLD_FEETY/OLD_FRAME*NEW)   # proportional feet baseline in new frame
ERODE=2
THRESH=40

src=Image.open(SRC).convert('RGB')
W,H=src.size; cw,ch=W//3,H//3
arr=np.asarray(src)
fg=arr.min(axis=2) < (255-THRESH)

DIRS=['nw','n','ne','w','e','sw','s','se']
CELLS=[(0,0),(0,1),(0,2),(1,0),(1,2),(2,0),(2,1),(2,2)]
# E/W are clipped -> use a bleed window to include the overflow foot. Others: plain cell.
BLEED={'e':40,'w':40}

def edge_seed_alpha(rgbcrop):
    """Edge-seeded flood-fill white bg removal (same as slice tool, white bg),
    keep largest comps, erode for halo. Returns L alpha (uint8)."""
    c=rgbcrop.convert('RGB'); w,h=c.size; px=np.asarray(c)
    isbg=(px.min(axis=2) >= (255-THRESH))
    flag=np.zeros((h,w),bool)
    dq=deque()
    for x in range(w):
        for yy in (0,h-1):
            if isbg[yy,x] and not flag[yy,x]: flag[yy,x]=True; dq.append((x,yy))
    for y in range(h):
        for xx in (0,w-1):
            if isbg[y,xx] and not flag[y,xx]: flag[y,xx]=True; dq.append((xx,y))
    while dq:
        x,y=dq.popleft()
        for nx,ny in ((x+1,y),(x-1,y),(x,y+1),(x,y-1)):
            if 0<=nx<w and 0<=ny<h and isbg[ny,nx] and not flag[ny,nx]:
                flag[ny,nx]=True; dq.append((nx,ny))
    fgmask=(~flag)
    # connected comps on fgmask, keep big ones
    lab=np.zeros((h,w),int); cur=0; sizes={}
    for sy in range(h):
        for sx in range(w):
            if fgmask[sy,sx] and lab[sy,sx]==0:
                cur+=1; cnt=0; st=[(sx,sy)]; lab[sy,sx]=cur
                while st:
                    x,y=st.pop(); cnt+=1
                    for nx,ny in ((x+1,y),(x-1,y),(x,y+1),(x,y-1)):
                        if 0<=nx<w and 0<=ny<h and fgmask[ny,nx] and lab[ny,nx]==0:
                            lab[ny,nx]=cur; st.append((nx,ny))
                sizes[cur]=cnt
    if not sizes: return None
    biggest=max(sizes.values())
    keep={l for l,cnt in sizes.items() if cnt>=max(800,biggest*0.05)}
    alpha=np.where(np.isin(lab,list(keep)),255,0).astype('uint8')
    al=Image.fromarray(alpha,'L')
    for _ in range(ERODE):
        al=al.filter(ImageFilter.MinFilter(3))
    return al

def owner_only(rgba, cell_box):
    """keep only opaque comp owning cell_box (most px inside)."""
    a=np.asarray(rgba.split()[3])>40
    h,w=a.shape; lab=np.zeros((h,w),int); cur=0; incell={}
    cx0,cy0,cx1,cy1=cell_box
    for sy in range(h):
        for sx in range(w):
            if a[sy,sx] and lab[sy,sx]==0:
                cur+=1; st=[(sx,sy)]; lab[sy,sx]=cur; cin=0
                while st:
                    x,y=st.pop()
                    if cx0<=x<cx1 and cy0<=y<cy1: cin+=1
                    for nx,ny in ((x+1,y),(x-1,y),(x,y+1),(x,y-1)):
                        if 0<=nx<w and 0<=ny<h and a[ny,nx] and lab[ny,nx]==0:
                            lab[ny,nx]=cur; st.append((nx,ny))
                incell[cur]=cin
    if not incell: return rgba
    owner=max(incell,key=lambda l:(incell[l],l))
    arr=np.array(rgba)
    arr[(lab!=owner)]=(arr[(lab!=owner)][:,:3].tolist() and 0) if False else arr[(lab!=owner)]
    mask=(lab!=owner)
    arr[mask,3]=0
    return Image.fromarray(arr,'RGBA')

results={}
for d,(r,c) in zip(DIRS,CELLS):
    b=BLEED.get(d,0)
    x0=max(0,c*cw-b); y0=max(0,r*ch-b); x1=min(W,(c+1)*cw+b); y1=min(H,(r+1)*ch+b)
    crop=src.crop((x0,y0,x1,y1))
    al=edge_seed_alpha(crop)
    rgba=crop.convert('RGBA'); rgba.putalpha(al)
    if b>0:
        cellbox=(c*cw-x0, r*ch-y0, (c+1)*cw-x0, (r+1)*ch-y0)
        rgba=owner_only(rgba,cellbox)
    bb=rgba.split()[3].getbbox()
    fig=rgba.crop(bb)
    # target body height = shipped bodyH for this facing (preserve scale exactly)
    sh=np.asarray(Image.open(f'assets/char/playerheavy-{d}.png').convert('RGBA'))[:,:,3]>40
    shy,shx=np.where(sh)
    target_h=shy.max()-shy.min()+1
    sf=target_h/fig.height
    nw_,nh_=max(1,round(fig.width*sf)), max(1,round(fig.height*sf))
    fig=fig.resize((nw_,nh_), Image.LANCZOS)
    # place: feet baseline at FEETY, horizontally centered
    canvas=Image.new('RGBA',(NEW,NEW),(0,0,0,0))
    px=(NEW-fig.width)//2
    py=FEETY-fig.height
    canvas.alpha_composite(fig,(px,py))
    results[d]=canvas
    fa=np.asarray(canvas)[:,:,3]>40
    fy,fx=np.where(fa)
    print(f'{d}: frame {NEW} body {fx.max()-fx.min()+1}x{fy.max()-fy.min()+1} feetY={fy.max()} (target_h={target_h}) clipL={int(fa[:,0].sum())} clipR={int(fa[:,NEW-1].sum())}')
    canvas.save(f'{OUTDIR}/playerheavy-{d}.png', optimize=True)
print('FEETY new frame =',FEETY)
