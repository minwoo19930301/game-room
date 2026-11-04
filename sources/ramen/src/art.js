// Authored cel-shaped cookware. Every ingredient, handle, reflection and shadow is
// an editable Canvas path; no original game sprite or screenshot is used here.
const INK = "#8a3b31";
export function path(c, d, fill, stroke = INK, width = 3) {
  const p = new Path2D(d);
  if (fill) {
    c.fillStyle = fill;
    c.fill(p);
  }
  if (stroke) {
    c.strokeStyle = stroke;
    c.lineWidth = width;
    c.stroke(p);
  }
}
export function ellipse(c, x, y, rx, ry, fill, stroke = null, width = 3) {
  c.beginPath();
  c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  if (fill) {
    c.fillStyle = fill;
    c.fill();
  }
  if (stroke) {
    c.strokeStyle = stroke;
    c.lineWidth = width;
    c.stroke();
  }
}
export function round(c, x, y, w, h, r, fill, stroke = null, width = 3) {
  c.beginPath();
  c.roundRect(x, y, w, h, r);
  if (fill) {
    c.fillStyle = fill;
    c.fill();
  }
  if (stroke) {
    c.strokeStyle = stroke;
    c.lineWidth = width;
    c.stroke();
  }
}
export function text(
  c,
  t,
  x,
  y,
  size = 20,
  color = "#7d3046",
  align = "center",
) {
  c.font = `${size}px Galmuri, sans-serif`;
  c.textAlign = align;
  c.textBaseline = "middle";
  c.fillStyle = color;
  c.fillText(t, x, y);
}
export function noodle(c, x, y, scale = 1, loose = false) {
  c.save();
  c.translate(x, y);
  c.scale(scale, scale);
  c.rotate(-0.12);
  if (!loose) {
    path(
      c,
      "M-48-32Q-51-36-45-39L44-34Q51-33 53-26L46 31Q45 37 39 39L-47 31Z",
      "#ffcf59",
      "#b2732c",
      3,
    );
    path(c, "M-42-30L43-25 37 29-40 24Z", "#ffe392", null);
  }
  c.strokeStyle = "#ca812c";
  c.lineWidth = 3;
  c.lineCap = "round";
  for (let row = 0; row < 7; row++) {
    c.beginPath();
    for (let col = 0; col < 9; col++) {
      const xx = -39 + col * 9,
        yy = -25 + row * 8;
      col ? c.lineTo(xx, yy) : c.moveTo(xx, yy);
      c.quadraticCurveTo(xx + 2, yy - 5, xx + 5, yy);
      c.quadraticCurveTo(xx + 8, yy + 5, xx + 9, yy);
    }
    c.stroke();
  }
  c.restore();
}
export function spice(c, x, y, s = 1) {
  c.save();
  c.translate(x, y);
  c.scale(s, s);
  c.rotate(0.13);
  path(
    c,
    "M-38-48L-28-44-19-49-9-44 1-49 11-44 21-49 31-44 39-48 36 45 26 41 16 47 6 42-4 47-14 42-24 47-36 44Z",
    "#ed4640",
    "#982c36",
  );
  path(c, "M-30-31Q0-39 31-30L28 30Q0 24-30 32Z", "#ffdd70", null);
  text(c, "블루", 0, -11, 18, "#b73a30");
  text(c, "스프", 0, 13, 21, "#b73a30");
  c.strokeStyle = "#ff8775";
  c.lineWidth = 3;
  c.beginPath();
  c.moveTo(-28, -38);
  c.lineTo(29, -39);
  c.moveTo(-26, 35);
  c.lineTo(27, 35);
  c.stroke();
  c.restore();
}
export function egg(c, x, y, s = 1, cracked = false) {
  c.save();
  c.translate(x, y);
  c.scale(s, s);
  if (cracked) {
    path(
      c,
      "M-34-4Q-43-20-23-25Q-3-43 16-25Q42-26 40-4Q51 16 22 24Q5 39-12 24Q-39 30-34-4",
      "#fff8d8",
      "#d49b57",
      2,
    );
    ellipse(c, 1, -2, 17, 14, "#ffbf26", "#e49330", 2);
    ellipse(c, -4, -6, 6, 3, "#ffe080");
  } else {
    path(
      c,
      "M0-42C-22-40-40-5-34 17C-29 40 27 43 35 17C41-4 24-42 0-42Z",
      "#fff1d2",
      "#bd755d",
      3,
    );
    path(c, "M-9-29Q-27-18-24 7Q-18 12-14 3Q-18-15-5-22Z", "#fffdf0", null);
  }
  c.restore();
}
export function scallion(c, x, y, s = 1, chopped = false) {
  c.save();
  c.translate(x, y);
  c.scale(s, s);
  if (chopped) {
    for (let i = 0; i < 9; i++) {
      const px = (i % 3) * 17 - 17,
        py = Math.floor(i / 3) * 14 - 14;
      ellipse(c, px, py, 8, 5, "#4b983f", "#336d37", 2);
      ellipse(c, px, py, 3, 2, "#c9e891");
    }
  } else {
    for (let i = 0; i < 6; i++) {
      c.save();
      c.rotate((i - 3) * 0.13);
      path(
        c,
        `M${-17 + i * 7} 40Q${-25 + i * 7} 0 ${-18 + i * 6} -57L${-9 + i * 6} -60Q${-12 + i * 7} 4 ${-9 + i * 7} 37Z`,
        i % 2 ? "#6bb348" : "#8dca59",
        "#3f7b3b",
        2,
      );
      path(
        c,
        `M${-17 + i * 7} 40L${-9 + i * 7} 37 ${-10 + i * 7} 12 ${-17 + i * 7} 13Z`,
        "#f6f1c5",
        null,
      );
      c.restore();
    }
    path(c, "M-34 20L31 15 34 24-32 30Z", "#e98174", "#b15855", 2);
  }
  c.restore();
}
export function kettle(c, x, y, s = 1, tilt = 0) {
  c.save();
  c.translate(x, y);
  c.scale(s, s);
  c.rotate(tilt);
  ellipse(c, 0, 63, 70, 15, "#924b3635");
  path(c, "M-55-28C-93-179 94-165 56-27", "#f5b524", "#945329", 10);
  path(c, "M-48-37C-80-145 77-142 48-37", null, "#ffdf6a", 6);
  path(c, "M-62-4L-109-49-115-72-99-76-67-48-37-18Z", "#efb51f", "#915026", 4);
  path(
    c,
    "M-68 3C-80 77 76 87 72 13C72-22 39-46 0-48C-43-47-63-30-68 3Z",
    "#edb825",
    "#9b602a",
    4,
  );
  path(c, "M-60 14C-46-2-30-4-18 3C-7 32-20 54-48 48Z", "#ffdc68", null);
  path(c, "M39 6C66 4 64 51 29 60L6 63C43 40 45 24 39 6Z", "#c98920", null);
  ellipse(c, 0, -21, 63, 22, "#ffcf45", "#99582c", 4);
  ellipse(c, 0, -26, 48, 13, "#f8c92f", "#ba7825", 2);
  path(c, "M-10-28L-12-49Q0-58 12-49L10-28Z", "#a06330", "#784731", 3);
  path(c, "M-6-45L-5-32", null, "#e49d46", 3);
  ellipse(c, -26, -24, 19, 4, "#fff0a0");
  c.restore();
}
export function mitt(c, x, y, s = 1, angle = 0) {
  c.save();
  c.translate(x, y);
  c.rotate(angle);
  c.scale(s, s);
  path(
    c,
    "M-28 35L-36-9Q-39-26-27-35Q-17-42-8-34L-4-44Q4-51 13-43L22-16Q35-38 43-22Q48-12 34 13L22 36Z",
    "#f27c92",
    "#94394d",
    4,
  );
  path(c, "M-24 30L19 29 23 45-25 48Z", "#fff3d7", "#963c4b", 3);
  c.save();
  c.beginPath();
  c.moveTo(-30, -25);
  c.lineTo(28, -12);
  c.lineTo(18, 26);
  c.lineTo(-24, 25);
  c.clip();
  c.strokeStyle = "#bc526b";
  c.lineWidth = 1.8;
  for (let i = -60; i < 70; i += 12) {
    c.beginPath();
    c.moveTo(i, -60);
    c.lineTo(i + 60, 60);
    c.moveTo(i + 60, -60);
    c.lineTo(i, 60);
    c.stroke();
  }
  c.restore();
  path(c, "M-21-19Q-23-28-16-28", null, "#ffcfce", 5);
  c.restore();
}
export function sponge(c, x, y, s = 1) {
  c.save();
  c.translate(x, y);
  c.scale(s, s);
  path(c, "M-43-15L-17-33 44-13 18 11Z", "#f8dc58", "#bb8e39", 3);
  path(c, "M-43-15L18 11 18 31-43 7Z", "#efb644", "#bb8e39", 3);
  path(c, "M18 11L44-13 44 8 18 31Z", "#8daf71", "#5e7a50", 3);
  for (let i = 0; i < 9; i++)
    ellipse(
      c,
      -30 + (i % 5) * 12,
      -11 + Math.floor(i / 5) * 10,
      2,
      2,
      "#cd9837",
    );
  for (const [xx, yy, r] of [
    [-34, -30, 9],
    [-15, -44, 12],
    [8, -36, 8],
  ])
    ellipse(c, xx, yy, r, r, "#ecffffb8", "#b6dcd6", 2);
  c.restore();
}
export function tool(c, id, x, y, s = 1, angle = 0) {
  if (id === "water") return kettle(c, x, y, s, angle);
  if (id === "mitt") return mitt(c, x, y, s, angle);
  ({ water: kettle, noodle, spice, egg, green: scallion, mitt, wash: sponge })[
    id
  ]?.(c, x, y, s);
}
export function burner(c, x, y, lit, t) {
  c.save();
  c.translate(x, y);
  ellipse(c, 0, 36, 107, 38, "#db5a80", "#9e4760", 3);
  ellipse(c, 0, 28, 86, 27, "#664747", "#9d465a", 4);
  if (lit) {
    for (let i = 0; i < 13; i++) {
      const a = (i * Math.PI * 2) / 13,
        px = Math.cos(a) * 67,
        py = 26 + Math.sin(a) * 20;
      const f = 13 + Math.sin(t * 9 + i) * 4;
      path(
        c,
        `M${px - 5} ${py}Q${px - 8} ${py - f / 2} ${px} ${py - f}Q${px + 9} ${py - f / 2} ${px + 5} ${py}Z`,
        "#89d8ef",
        "#3e9ecb",
        1,
      );
    }
  }
  c.strokeStyle = "#514046";
  c.lineWidth = 8;
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2 + 0.3;
    c.beginPath();
    c.moveTo(Math.cos(a) * 52, 28 + Math.sin(a) * 17);
    c.lineTo(Math.cos(a) * 94, 28 + Math.sin(a) * 29);
    c.stroke();
  }
  c.restore();
}
export function pot(c, x, y, p, t, hover = false, s = 1) {
  c.save();
  c.translate(x, y);
  c.scale(s, s);
  const ruined = p.ruined;
  const golden = ruined ? "#766451" : "#f4bc20";
  if (hover) {
    ellipse(c, 0, 26, 117, 46, "#fff0ad85", "#fff7c7", 5);
  }
  ellipse(c, 0, 37, 103, 27, "#94393d33");
  path(c, "M-76-30C-118-49-129-3-91 8L-73-5", "#e7a820", "#9b5b24", 4);
  path(c, "M-88-23C-110-31-113-7-91-4", null, "#ffe289", 7);
  path(c, "M75-30C118-49 129-3 91 8L73-5", "#e7a820", "#9b5b24", 4);
  path(c, "M88-23C110-31 113-7 91-4", null, "#ffe289", 7);
  path(
    c,
    "M-87-33Q-82 29-62 41Q0 70 66 39Q84 20 87-33Z",
    golden,
    ruined ? "#4a443f" : "#a76a25",
    4,
  );
  path(
    c,
    "M-71-16Q-67 22-52 33Q-37 40-27 35L-31-9Z",
    ruined ? "#95846c" : "#ffe075",
    null,
  );
  path(
    c,
    "M63-13Q62 27 43 38Q25 47 7 45Q52 41 47-9Z",
    ruined ? "#544b43" : "#d99418",
    null,
  );
  ellipse(
    c,
    0,
    -34,
    89,
    34,
    ruined ? "#514638" : "#ffe571",
    ruined ? "#49423d" : "#b07524",
    4,
  );
  ellipse(
    c,
    0,
    -32,
    79,
    27,
    ruined
      ? "#302f2a"
      : p.water
        ? p.spice
          ? "#d76623"
          : "#86c6cd"
        : "#deb03b",
    ruined ? "#4f483c" : "#cf8b1d",
    3,
  );
  if (p.water && !ruined) {
    ellipse(c, -26, -38, 30, 6, p.spice ? "#f5ac47" : "#ceeff0");
    if (p.noodle) {
      c.save();
      c.translate(0, -29);
      c.scale(0.86, 0.34);
      noodle(c, 0, 0, 1, true);
      c.restore();
    }
    if (p.egg) egg(c, -24, -29, 0.69, true);
    if (p.green) scallion(c, 26, -25, 0.62, true);
    if (p.age >= 5) {
      for (let i = 0; i < 8; i++) {
        const a = t * 2 + i * 2.4;
        ellipse(
          c,
          Math.sin(a * 1.3) * 55,
          -32 + Math.cos(a) * 16,
          3 + Math.sin(a) ** 2 * 4,
          2 + Math.sin(a) ** 2 * 2,
          p.spice ? "#ffd16ab0" : "#edffffaf",
          null,
        );
      }
    }
  }
  if (!p.water && !ruined) {
    if (p.noodle) {
      c.save();
      c.translate(0, -30);
      c.scale(0.75, 0.4);
      noodle(c, 0, 0);
      c.restore();
    }
    if (p.spice) {
      for (let i = 0; i < 20; i++)
        ellipse(
          c,
          Math.sin(i * 72) * 40,
          -32 + Math.cos(i * 9) * 14,
          2,
          1,
          "#ae4124",
        );
    }
  }
  if (ruined) {
    path(
      c,
      "M-45-32L-26-45-6-32 10-43 26-28 41-39 54-20 16-13-17-18Z",
      "#241f21",
      null,
    );
    c.strokeStyle = "#b5a488";
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(-49, 10);
    c.lineTo(-34, 22);
    c.lineTo(-41, 34);
    c.stroke();
  }
  ellipse(c, -38, -54, 25, 4, ruined ? "#9e8f77" : "#fff4b5");
  c.restore();
}
export function steam(c, x, y, t, ruined = false) {
  c.save();
  c.strokeStyle = ruined ? "#62515099" : "#fffde8d9";
  c.lineWidth = ruined ? 10 : 6;
  c.lineCap = "round";
  for (let i = 0; i < 3; i++) {
    const drift = Math.sin(t * 2 + i) * 8;
    c.beginPath();
    c.moveTo(x - 30 + i * 30, y - 60);
    c.bezierCurveTo(
      x - 55 + i * 30 + drift,
      y - 84,
      x - 12 + i * 30 - drift,
      y - 98,
      x - 33 + i * 30,
      y - 123,
    );
    c.stroke();
  }
  c.restore();
}
export function tray(c, x, y, active = false) {
  c.save();
  c.translate(x, y);
  path(
    c,
    "M-129-53L107-53 137 34-112 35Z",
    active ? "#fff0a7" : "#f4b8bb",
    "#b76a70",
    4,
  );
  path(c, "M-113-42L97-42 118 22-98 23Z", "#af646e", "#d58995", 4);
  path(c, "M-112 35L137 34 134 53-109 55Z", "#cc8393", "#994e68", 3);
  for (let i = 0; i < 13; i++)
    round(c, -92 + i * 16, 40, 8, 7, 1, null, "#ffd9c8", 1);
  path(c, "M56-39L91-105 97-102 61-37Z", "#eea342", "#986135", 2);
  path(c, "M69-38L105-101 111-97 75-35Z", "#eea342", "#986135", 2);
  c.restore();
}
