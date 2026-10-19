#!/usr/bin/env python3
"""Build lightweight, branded project GIFs from the supplied technology photos."""
from pathlib import Path
import math
from PIL import Image, ImageDraw, ImageFont, ImageOps

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "assets" / "projects" / "animations"
W, H = 960, 540
PHOTO_W = 500
PANEL = (500, 0, W, H)
CORAL = "#EF8556"
CORAL_DARK = "#A34825"
SKY = "#5FBAD6"
SKY_DARK = "#267F9D"
PLUM = "#685599"
PLUM_DARK = "#45335F"
INK = "#302B3D"
MUTED = "#625B6A"
PAPER = "#FCFAFC"
LINE = "#E5DFE9"

FONT_PATHS = [
    "/System/Library/Fonts/Supplemental/Arial.ttf",
    "/Library/Fonts/Arial.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
]
FONT_BOLD_PATHS = [
    "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
    "/Library/Fonts/Arial Bold.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
]

def font(size, bold=False):
    for path in (FONT_BOLD_PATHS if bold else FONT_PATHS):
        if Path(path).exists():
            return ImageFont.truetype(path, size)
    return ImageFont.load_default()

FONTS = {size: font(size) for size in (13, 14, 16, 18, 20, 22, 25, 28)}
FONTS.update({("bold", size): font(size, True) for size in (13, 14, 16, 18, 20, 22, 25, 28, 30)})

def text(draw, xy, value, size, fill=INK, bold=False):
    draw.text(xy, value, font=FONTS[("bold", size)] if bold else FONTS[size], fill=fill)

def cover(source, size):
    image = Image.open(source).convert("RGB")
    return ImageOps.fit(image, size, method=Image.Resampling.LANCZOS, centering=(0.5, 0.52))

def path_progress(draw, points, progress, color=CORAL, width=6, dash=False):
    lengths=[]
    total=0
    for a,b in zip(points, points[1:]):
        length=math.dist(a,b); lengths.append(length); total+=length
    left=total*progress
    for (a,b),length in zip(zip(points,points[1:]),lengths):
        used=min(length,left)
        if used>0:
            t=used/length
            end=(round(a[0]+(b[0]-a[0])*t),round(a[1]+(b[1]-a[1])*t))
            if dash:
                segments=max(1, math.ceil(used/13))
                for index in range(segments):
                    if index%2==0:
                        start_t=index/segments; stop_t=min(1,(index+.55)/segments)
                        start=(round(a[0]+(end[0]-a[0])*start_t),round(a[1]+(end[1]-a[1])*start_t))
                        stop=(round(a[0]+(end[0]-a[0])*stop_t),round(a[1]+(end[1]-a[1])*stop_t))
                        draw.line([start,stop],fill=color,width=width)
            else:
                draw.line([a,end],fill=color,width=width)
        left-=length
        if left<=0: break

def rounded(draw, box, radius=18, fill="white", outline=LINE, width=2):
    draw.rounded_rectangle(box,radius=radius,fill=fill,outline=outline,width=width)

def progress_dot(draw, point, active):
    radius=9
    draw.ellipse((point[0]-radius-4,point[1]-radius-4,point[0]+radius+4,point[1]+radius+4),fill="#FFFFFF",outline=CORAL,width=3)
    if active: draw.ellipse((point[0]-radius,point[1]-radius,point[0]+radius,point[1]+radius),fill=CORAL)

def stage_box(draw, title, subtitle=None):
    rounded(draw,(535,180,925,453),22,"#FFFFFF",LINE,2)
    text(draw,(560,202),title,22,PLUM_DARK,True)

def draw_talebot(draw,p):
    title="Ruta de colores"
    stage_box(draw,title,"Secuencias · direcciones · orientación")
    x0,y0=588,262; step=61
    for row in range(3):
        for col in range(5):
            x=x0+col*step; y=y0+row*step
            draw.rounded_rectangle((x,y,x+45,y+45),radius=10,fill="#F8F5FA",outline=LINE,width=2)
    points=[(x0+22,y0+22),(x0+83,y0+22),(x0+144,y0+22),(x0+144,y0+83),(x0+205,y0+83),(x0+266,y0+83),(x0+266,y0+144)]
    path_progress(draw,points,p,SKY_DARK,7)
    for i,pt in enumerate(points): progress_dot(draw,pt,i/max(1,len(points)-1)<=p)
    x,y=points[min(len(points)-1,int(p*(len(points)-1)))]; direction="▶" if x<points[-1][0] else "▼"
    text(draw,(x-11,y-13),direction,16,PLUM_DARK,True)

def draw_robot_master(draw,p):
    stage_box(draw,"Carro con movimiento","Construcción · engranajes · programación")
    x=int(590+p*185); y=332
    draw.line((574,410,875,410),fill="#DCEBF0",width=5)
    # Build from a bright, classroom robotics kit: chassis, wheels, axles, sensor.
    draw.rounded_rectangle((x,y,x+155,y+50),radius=13,fill=SKY,outline=PLUM_DARK,width=3)
    draw.polygon([(x+28,y),(x+51,y-38),(x+112,y-38),(x+136,y)],fill=CORAL,outline=PLUM_DARK)
    draw.rectangle((x+60,y-31,x+103,y-6),fill="#FFF6E6",outline=PLUM_DARK,width=2)
    for wx in (x+32,x+122):
        draw.ellipse((wx-20,y+37,wx+20,y+77),fill=PLUM_DARK)
        draw.ellipse((wx-9,y+48,wx+9,y+66),fill="#FFFFFF")
    draw.rectangle((x+75,y+48,x+86,y+62),fill=CORAL_DARK)
    # gentle wheel motion cue and block instructions
    for i in range(3):
        xx=608+i*93
        rounded(draw,(xx,239,xx+76,280),10,"#EDE7F4",None,0)
        text(draw,(xx+25,250),["→","↻","→"][i],22,PLUM_DARK,True)
    path_progress(draw,[(601,300),(700,300),(760,280),(874,280)],p,CORAL,5,True)

def draw_spike(draw,p):
    stage_box(draw,"Robot cartógrafo","Programación · medición · resolución de retos")
    x0,y0=575,251; step=54
    for row in range(4):
        for col in range(6):
            x=x0+col*step; y=y0+row*step
            draw.rounded_rectangle((x,y,x+44,y+42),radius=6,fill="#F7F5F9",outline="#EAE5ED",width=1)
    for x,y,w,h,c in [(592,266,65,38,"#EAF5F7"),(698,321,70,35,"#FCEFE8"),(808,264,50,46,"#EDE7F4"),(755,373,93,30,"#EAF5F7")]:
        draw.rounded_rectangle((x,y,x+w,y+h),radius=6,fill=c,outline=LINE,width=2)
        draw.rectangle((x+12,y+10,x+w-12,y+15),fill="#D7CFE0")
    pts=[(590,392),(644,392),(644,338),(752,338),(752,284),(861,284)]
    path_progress(draw,pts,p,CORAL,6,True)
    for i,pt in enumerate((pts[0],pts[2],pts[4],pts[5])): progress_dot(draw,pt,(i/3)<=p)
    x,y=pts[min(len(pts)-1,int(p*(len(pts)-1)))]; rounded(draw,(x-15,y-14,x+15,y+14),8,SKY,PLUM_DARK,2)
    draw.ellipse((x-7,y-6,x-2,y-1),fill=PLUM_DARK); draw.ellipse((x+2,y-6,x+7,y-1),fill=PLUM_DARK)

def draw_snap(draw,p):
    stage_box(draw,"Linterna que enciende","Circuitos · energía · causa y efecto")
    # modular circuit blocks and an illuminated LED
    rounded(draw,(578,295,644,374),12,"#EAF5F7",SKY,3)
    draw.rectangle((598,281,624,295),fill=PLUM_DARK)
    text(draw,(591,321),"+",20,PLUM_DARK,True)
    path=[(644,311),(692,311),(692,277),(763,277),(763,343),(836,343)]
    path_progress(draw,path,p,SKY_DARK,7)
    rounded(draw,(685,294,720,328),6,CORAL,"#FFFFFF",2)
    text(draw,(693,300),"S",16,"#FFFFFF",True)
    # LED rays ease in as the current reaches the bulb
    cx,cy=852,343
    draw.line((836,343,843,343),fill=SKY_DARK,width=7)
    draw.line((843,343,843,322),fill=SKY_DARK,width=6)
    glow=round(40*p)
    if glow>0: draw.ellipse((cx-glow,cy-59-glow,cx+glow,cy-59+glow),fill=(255,205,140,100))
    draw.ellipse((cx-20,cy-83,cx+20,cy-43),fill="#FFE7A8" if p>.62 else "#F7F5F9",outline=CORAL,width=4)
    draw.rectangle((cx-10,cy-45,cx+10,cy-30),fill=CORAL_DARK)
    for a in range(3):
        xx=cx-31+a*31
        draw.line((xx,cy-99,xx+(a-1)*8,cy-110),fill=CORAL,width=3)
    text(draw,(574,397),"PILA",13,PLUM_DARK,True); text(draw,(681,397),"INTERRUPTOR",13,PLUM_DARK,True); text(draw,(830,397),"LUZ",13,PLUM_DARK,True)

def draw_drone(draw,p):
    stage_box(draw,"Ruta de vuelo","Orientación espacial · secuencias · precisión")
    # flight course, gates, and a teaching drone moving along it
    rounded(draw,(575,252,889,401),14,"#F5FBFC",LINE,1)
    for x in range(594,889,35): draw.line((x,259,x,395),fill="#E7F0F2",width=1)
    for y in range(265,401,35): draw.line((581,y,883,y),fill="#E7F0F2",width=1)
    gates=[(623,335),(744,279),(846,354)]
    for i,(x,y) in enumerate(gates):
        draw.rounded_rectangle((x-17,y-23,x+17,y+23),radius=7,outline=SKY_DARK if i<2 else PLUM,width=4)
    pts=[(606,365),gates[0],(691,300),gates[1],(799,326),gates[2],(871,288)]
    path_progress(draw,pts,p,CORAL,5,True)
    x,y=pts[min(len(pts)-1,int(p*(len(pts)-1)))]
    draw.ellipse((x-13,y-6,x+13,y+6),fill="#FFFFFF",outline=PLUM_DARK,width=3)
    for dx,dy in ((-25,-14),(25,-14),(-25,14),(25,14)):
        draw.line((x,y,x+dx,y+dy),fill=PLUM_DARK,width=3)
        draw.ellipse((x+dx-7,y+dy-3,x+dx+7,y+dy+3),outline=CORAL,width=2)

def draw_vr(draw,p):
    stage_box(draw,"Exploración inmersiva","Ciencia · espacio 3D · aprendizaje guiado")
    rounded(draw,(577,252,885,395),18,"#2C2540",PLUM_DARK,2)
    # calm orbital scene, the path expands as the exploration progresses
    cx,cy=729,323
    draw.ellipse((cx-50,cy-50,cx+50,cy+50),fill="#4A3C69",outline="#8B78B8",width=2)
    draw.ellipse((cx-31,cy-34,cx+31,cy+29),fill="#5FBAD6")
    draw.ellipse((cx-20,cy-8,cx+18,cy+29),fill="#EF8556")
    star_points=[(610,277),(646,359),(829,277),(849,359),(702,268),(783,376)]
    for i,(x,y) in enumerate(star_points):
        size=2+(i%3)
        draw.ellipse((x-size,y-size,x+size,y+size),fill="#FFFFFF")
    radius=64+round(45*p)
    draw.ellipse((cx-radius,cy-36,cx+radius,cy+36),outline="#E7C7FF",width=3)
    angle=math.radians(-140+p*290)
    px=cx+int(radius*math.cos(angle)); py=cy+int(36*math.sin(angle))
    draw.ellipse((px-9,py-9,px+9,py+9),fill=CORAL,outline="#FFFFFF",width=2)
    for sx in (630,824):
        draw.rounded_rectangle((sx-25,370,sx+25,379),radius=4,fill="#D8D1E7")
    draw.line((671,392,787,392),fill=SKY,width=3)

PROJECTS = [
    {"key":"TaleBot","photo":"talebot-equipo.png","file":"rutas-pequenos.gif","title":"Rutas para\npequeños","tag":"ROBÓTICA PARA PEQUEÑOS","status":"EQUIPO REAL","caption":"Secuencias · direcciones · orientación","scene":draw_talebot},
    {"key":"Robot Master","photo":"robot-master-equipo.png","file":"robot-master-creaciones.gif","title":"Carro con\nmovimiento","tag":"ROBÓTICA PARA PRIMARIA","status":"EQUIPO REAL","caption":"Construcción · movimiento · lógica","scene":draw_robot_master},
    {"key":"Spike","photo":"robot-cartografo.png","file":"robot-cartografo-recorrido.gif","title":"Robot\ncartógrafo","tag":"ROBÓTICA PARA GRANDES","status":"PROGRAMA DISPONIBLE","caption":"Programación · medición · retos","scene":draw_spike},
    {"key":"Snap","photo":"circuitos.png","file":"circuitos-creaciones.gif","title":"Linterna que\nenciende","tag":"ELECTRÓNICA","status":"REFERENCIA DE AULA","caption":"Circuitos · energía · causa y efecto","scene":draw_snap},
    {"key":"Drones","photo":"drones-educativos-generado.png","file":"drones-recorrido.gif","title":"Ruta de\nvuelo","tag":"DRONES EDUCATIVOS","status":"IMAGEN ILUSTRATIVA","caption":"Orientación · secuencias · precisión","scene":draw_drone},
    {"key":"Meta","photo":"realidad-virtual.png","file":"exploracion-inmersiva.gif","title":"Exploración\ninmersiva","tag":"EXPERIENCIAS INMERSIVAS","status":"REFERENCIA DE AULA","caption":"Ciencia · espacio 3D · descubrimiento","scene":draw_vr},
]

def build(project):
    source=ROOT/"assets"/"projects"/project["photo"]
    photo=cover(source,(PHOTO_W,H))
    frames=[]
    count=11
    for index in range(count):
        progress=(index/(count-1))
        frame=Image.new("RGB",(W,H),PAPER)
        frame.paste(photo,(0,0))
        draw=ImageDraw.Draw(frame,"RGBA")
        # soft photo contrast + real equipment cue
        draw.rectangle((0,0,PHOTO_W,86),fill=(35,26,47,95))
        draw.rounded_rectangle((24,22,250,62),radius=18,fill=(255,255,255,235))
        text(draw,(40,33),project["status"],14,PLUM_DARK,True)
        # Right information panel
        draw.rectangle(PANEL,fill=PAPER)
        draw.rounded_rectangle((533,24,932,72),radius=18,fill="#F1ECF6")
        draw.ellipse((551,42,563,54),fill=CORAL)
        text(draw,(576,39),project["tag"],16,PLUM_DARK,True)
        text(draw,(540,96),"IDEA DE PROYECTO",16,CORAL_DARK,True)
        lines=project["title"].split("\n")
        for line_number,line in enumerate(lines): text(draw,(538,118+line_number*34),line,28,PLUM_DARK,True)
        project["scene"](draw,progress)
        # Progress markers make the build-to-result story understandable without adding text over the product.
        steps=["EXPLORA","CREA","PRUEBA"]
        for i,label in enumerate(steps):
            xx=544+i*127
            active=progress >= i/2
            bg=CORAL if active and i==2 else (PLUM_DARK if active else "#F1ECF6")
            fg="#FFFFFF" if active else MUTED
            draw.rounded_rectangle((xx,482,xx+114,519),radius=15,fill=bg)
            # step number in a small circle
            draw.ellipse((xx+9,491,xx+28,510),fill="#FFFFFF" if active else "#DDD5E6")
            text(draw,(xx+14,494),str(i+1),13,PLUM_DARK,True)
            text(draw,(xx+35,491),label,16,fg,True)
        frames.append(frame)
    # Smooth progression, brief pause on the finished result, then loop.
    frames += [frames[-1].copy() for _ in range(3)]
    # One shared palette across frames avoids color flashing and keeps assets compact.
    palette=frames[0].quantize(colors=96,method=Image.Quantize.MEDIANCUT)
    converted=[frame.quantize(palette=palette,dither=Image.Dither.NONE) for frame in frames]
    target=OUTPUT/project["file"]
    target.parent.mkdir(parents=True,exist_ok=True)
    converted[0].save(target,save_all=True,append_images=converted[1:],duration=[160]*(len(frames)-3)+[450]*3,loop=0,optimize=True,disposal=1)
    print(f"{project['key']}: {target.relative_to(ROOT)} · {target.stat().st_size//1024} KB · {W}×{H} · {len(frames)} frames")

if __name__=="__main__":
    for project in PROJECTS: build(project)
