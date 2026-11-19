// Colour grades for Vice Coast Cover Studio: a Vice City sunset sky, a photo
// filter and a wash that together give each grade its mood. All grades are
// drawn with canvas gradients and filters — no image files, no network.

export const GRADES = {
  sunset: {
    id: 'sunset',
    name: 'Vice Sunset',
    hint: 'Orange sky, pink streets',
    sky: ['#ffd166', '#ff7a3d', '#ff2e63', '#3b1055'],
    photoFilter: 'saturate(1.28) contrast(1.07) brightness(1.02)',
    wash: ['rgba(255, 94, 60, 0.16)', 'rgba(255, 46, 99, 0.10)', 'rgba(59, 16, 85, 0.22)'],
    accent: '#ff2e63',
  },
  neon: {
    id: 'neon',
    name: 'Neon Night',
    hint: 'Cyan signs, magenta glow',
    sky: ['#0affef', '#2b6cff', '#ff2bd6', '#12003a'],
    photoFilter: 'saturate(1.45) contrast(1.12) brightness(0.98)',
    wash: ['rgba(10, 255, 239, 0.12)', 'rgba(255, 43, 214, 0.14)', 'rgba(18, 0, 58, 0.26)'],
    accent: '#0affef',
  },
  golden: {
    id: 'golden',
    name: 'Golden Hour',
    hint: 'Warm late light',
    sky: ['#ffe9a3', '#ffb347', '#ff7b2f', '#7a2e0e'],
    photoFilter: 'saturate(1.32) contrast(1.05) sepia(0.18) brightness(1.03)',
    wash: ['rgba(255, 183, 71, 0.18)', 'rgba(255, 123, 47, 0.08)', 'rgba(122, 46, 14, 0.20)'],
    accent: '#ffb347',
  },
  vicepink: {
    id: 'vicepink',
    name: 'Vice Pink',
    hint: 'Bubblegum and violet',
    sky: ['#ff9de2', '#ff7ad9', '#b967ff', '#1b1035'],
    photoFilter: 'saturate(1.38) contrast(1.06) hue-rotate(-12deg)',
    wash: ['rgba(255, 122, 217, 0.16)', 'rgba(185, 103, 255, 0.12)', 'rgba(27, 16, 53, 0.22)'],
    accent: '#ff7ad9',
  },
  noir: {
    id: 'noir',
    name: 'Noir',
    hint: 'Black and white, hard light',
    sky: ['#e8e8e8', '#9a9a9a', '#3a3a3a', '#0d0d0d'],
    photoFilter: 'grayscale(1) contrast(1.18) brightness(1.02)',
    wash: ['rgba(255, 255, 255, 0.06)', 'rgba(0, 0, 0, 0.08)', 'rgba(0, 0, 0, 0.30)'],
    accent: '#ffffff',
  },
};

export const GRADE_ORDER = ['sunset', 'neon', 'golden', 'vicepink', 'noir'];

/** A grade by id, falling back to the sunset grade. */
export function gradeFor(gradeId) {
  return GRADES[gradeId] ?? GRADES.sunset;
}
