export interface Article {
  slug: string;
  title: string;
  h1: string;
  href: string;
  thumb: string;
  blockCount: number;
  imageCount: number;
}

export const quizzes: Article[] = [
  {
    "slug": "car-brand-country-challenge",
    "title": "Level: EasyUpdated Aug 15, 2026Car Brand Country Challenge",
    "h1": "Car Brand Country Challenge",
    "href": "https://www.carlogos.org/quizzes/car-brand-country-challenge.html",
    "thumb": "/images/quizzes/car-brand-country-challenge-pontiac-logo.png",
    "blockCount": 10,
    "imageCount": 9
  },
  {
    "slug": "car-model-challenge",
    "title": "Level: EasyUpdated Aug 15, 2026Car Model Challenge",
    "h1": "Car Model Challenge",
    "href": "https://www.carlogos.org/quizzes/car-model-challenge.html",
    "thumb": "/images/quizzes/car-model-challenge-car-model-challenge-q10.jpg",
    "blockCount": 10,
    "imageCount": 9
  },
  {
    "slug": "car-logo-quiz",
    "title": "Level: EasyUpdated Aug 17, 2026Car Logo Quiz",
    "h1": "Car Logo Quiz",
    "href": "https://www.carlogos.org/quizzes/car-logo-quiz.html",
    "thumb": "/images/quizzes/car-logo-quiz-car-logo-quiz-q79.jpg",
    "blockCount": 10,
    "imageCount": 9
  },
  {
    "slug": "guess-the-car",
    "title": "Level: EasyUpdated Aug 18, 2026Guess The Car",
    "h1": "Guess The Car",
    "href": "https://www.carlogos.org/quizzes/guess-the-car.html",
    "thumb": "/images/quizzes/guess-the-car-guess-the-car-q31.jpg",
    "blockCount": 10,
    "imageCount": 9
  },
  {
    "slug": "guess-the-car-founder",
    "title": "Level: MediumUpdated Aug 15, 2026Guess the Car Founder",
    "h1": "Guess the Car Founder",
    "href": "https://www.carlogos.org/quizzes/guess-the-car-founder.html",
    "thumb": "/images/quizzes/guess-the-car-founder-guess-the-car-founder-q21.jpg",
    "blockCount": 10,
    "imageCount": 9
  },
  {
    "slug": "spot-the-real-logo",
    "title": "Level: MediumUpdated Aug 15, 2026Spot the Real Logo",
    "h1": "Spot the Real Logo",
    "href": "https://www.carlogos.org/quizzes/spot-the-real-logo.html",
    "thumb": "/images/quizzes/spot-the-real-logo-spot-the-real-logo-q2.jpg",
    "blockCount": 10,
    "imageCount": 9
  },
  {
    "slug": "car-interior-challenge",
    "title": "Level: MediumUpdated Aug 16, 2026Car Interior Challenge",
    "h1": "Car Interior Challenge",
    "href": "https://www.carlogos.org/quizzes/car-interior-challenge.html",
    "thumb": "/images/quizzes/car-interior-challenge-car-interior-challenge-q36.jpg",
    "blockCount": 10,
    "imageCount": 9
  },
  {
    "slug": "muscle-car-challenge",
    "title": "Level: MediumUpdated Aug 17, 2026Muscle Car Challenge",
    "h1": "Muscle Car Challenge",
    "href": "https://www.carlogos.org/quizzes/muscle-car-challenge.html",
    "thumb": "/images/quizzes/muscle-car-challenge-muscle-car-challenge-q12.jpg",
    "blockCount": 10,
    "imageCount": 9
  },
  {
    "slug": "guess-car-tail-lights",
    "title": "Level: MediumUpdated Aug 18, 2026Guess the Car by Its Tail Lights",
    "h1": "Guess the Car by Its Tail Lights",
    "href": "https://www.carlogos.org/quizzes/guess-car-tail-lights.html",
    "thumb": "/images/quizzes/guess-car-tail-lights-guess-car-tail-lights-q18.jpg",
    "blockCount": 10,
    "imageCount": 9
  },
  {
    "slug": "guess-the-car-brand",
    "title": "Level: MediumUpdated Aug 19, 2026Guess the Car Brand",
    "h1": "Guess the Car Brand",
    "href": "https://www.carlogos.org/quizzes/guess-the-car-brand.html",
    "thumb": "/images/quizzes/guess-the-car-brand-guess-the-car-brand-q15.jpg",
    "blockCount": 10,
    "imageCount": 9
  },
  {
    "slug": "car-part-quiz",
    "title": "Level: MediumUpdated Jul 30, 2026Car Part Quiz",
    "h1": "Car Part Quiz",
    "href": "https://www.carlogos.org/quizzes/car-part-quiz.html",
    "thumb": "/images/quizzes/car-part-quiz-car-part-quiz-q6.jpg",
    "blockCount": 10,
    "imageCount": 9
  }
];

export const quizzeBySlug = (slug: string): Article | undefined =>
  quizzes.find((a) => a.slug === slug);
