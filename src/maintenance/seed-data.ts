/* eslint-disable max-len */

import fs from 'fs';
import path from 'path';
import { AnyEntity } from '@mikro-orm/core';
import { fakerEN } from '@faker-js/faker';
import { UserEntity } from '../users/user.entity';
import { ImageEntity } from '../images/image.entity';
import { MeetupEntity } from '../meetups/entities/meetup.entity';
import { AgendaItemEntity } from '../meetups/entities/agenda-item.entity';

type ImageFile = {
  data?: Buffer;
  size?: number;
  mimetype?: string;
};

const USER_COUNT = 10;
const MEETUP_COUNT = 15;

function readImageSync(filename: string): ImageFile {
  const image: ImageFile = {};
  image.data = fs.readFileSync(
    path.join(__dirname, '../../data/images', filename),
  );
  image.size = image.data.length;
  image.mimetype = filename.endsWith('.png') ? 'image/png' : 'image/jpeg';
  return image;
}

const CURRENT_YEAR = new Date().getUTCFullYear();
const CURRENT_MONTH = new Date().getUTCMonth();

const IMAGES = [
  readImageSync('anastasia-kuznichenkova-8w_JshgzTjY-unsplash-compressor.jpg'),
  readImageSync('antenna-ohNCIiKVT1g-unsplash-compressor.jpg'),
  readImageSync('charles-deluvio-wn7dOzUh3Rs-unsplash-compressor.jpg'),
  readImageSync('jakob-dalbjorn-cuKJre3nyYc-unsplash-compressor.jpg'),
  readImageSync('neonbrand-1-aA2Fadydc-unsplash-compressor.jpg'),
];

const TITLES = [
  'Jfokus Developers Conference',
  'Laracon EU',
  'GopherCon Europe',
  'Gamesforum Barcelona 2024',
  'C++ on Sea',
  'RBCN24',
  'ProIT Fest',
  'NDC Sydney',
  'BASTA!',
  'OBCX',
  'PHP UK',
  'Cinimex DATA meetup',
  'Mobile PeerLab #1',
  'React Native Workshop: как создавать нативные модули',
  'Зимние Аналитические Выходные',
  'Первая всероссийская студенческая олимпиада по фронтенду',
  'Праздничный митап в честь 33-летия Python от Сбера',
  'LLVM-митап #3',
  'Устраняем баги без отладчика: юнит-тесты в C++ на практике',
  'FLUTTER HEROES',
  'Prague Python Pizza',
  'DATA SATURDAY #40',
  'MWC Barcelona',
  'Митап для продуктовых аналитиков от Тинкофф',
  'C++ ОНЛАЙН 2024',
  'DEVGAMM GDAŃSK 2024',
  'JSWORLD CONFERENCE',
  'DEVWORLD CONFERENCE',
  'С++ ОНЛАЙН 2024',
];

const uniqueMeetupTitleGetter = (titles: string[]) => {
  let restTitles = [...titles];
  return () => {
    const title = fakerEN.helpers.arrayElement(restTitles);
    restTitles = restTitles.filter((it) => it !== title);
    return title;
  };
};

function buildImage(imageFile: ImageFile, user: UserEntity): ImageEntity {
  const image = new ImageEntity();
  image.data = imageFile.data;
  image.size = imageFile.size;
  image.mimetype = imageFile.mimetype;
  image.user = user;
  return image;
}

const getSpeaker = () =>
  `${fakerEN.person.fullName()} — ${fakerEN.person.jobTitle()}, ${fakerEN.company.name()}`;

const getTitle = () => fakerEN.lorem.sentence().slice(0, -1);
const getDescription = () => fakerEN.lorem.paragraph().slice(0, -1);

export function getDataToSeed(): AnyEntity[] {
  const randomPassword = () =>
    Math.random()
      .toFixed(16)
      .toString()
      .substring(2);

  const getMeetupTitle = uniqueMeetupTitleGetter(TITLES);

  const userDemo = new UserEntity({
    email: 'demo@email',
    fullname: 'Demo User',
    password: '111111',
  });

  const userAdmin = new UserEntity({
    email: 'admin@email',
    fullname: 'Admin',
    password: '111111',
  });

  const users = Array(USER_COUNT)
    .fill(1)
    .map(
      () =>
        new UserEntity({
          email: fakerEN.internet.email(),
          fullname: fakerEN.person.fullName(),
          password: randomPassword(),
        }),
    );

  users.push(userDemo);

  const meetups = Array(MEETUP_COUNT)
    .fill(1)
    .map(() => {
      const meetup = new MeetupEntity({
        date: fakerEN.date.soon({ days: 50 }).getTime(),
        place: `${fakerEN.location.streetAddress()}, ${fakerEN.location.city()}`,
        title: getMeetupTitle(),
        description: getDescription(),
      });

      meetup.organizer = fakerEN.helpers.arrayElement(users);
      meetup.image = buildImage(
        fakerEN.helpers.arrayElement(IMAGES),
        meetup.organizer,
      );

      if (fakerEN.helpers.arrayElement([true, false])) {
        meetup.participants.add(userDemo);
      }

      meetup.agenda.add(
        new AgendaItemEntity({
          startsAt: '18:30',
          endsAt: '19:00',
          type: 'registration',
        }),
        new AgendaItemEntity({
          startsAt: '19:00',
          endsAt: '19:45',
          type: 'talk',
          language: 'EN',
          title: getTitle(),
          description: getDescription(),
          speaker: getSpeaker(),
        }),
        new AgendaItemEntity({
          startsAt: '19:45',
          endsAt: '20:15',
          type: 'coffee',
        }),
        new AgendaItemEntity({
          startsAt: '20:15',
          endsAt: '21:00',
          type: 'talk',
          language: 'EN',
          title: getTitle(),
          description: getDescription(),
          speaker: getSpeaker(),
        }),
        new AgendaItemEntity({
          startsAt: '21:00',
          endsAt: '21:45',
          type: 'talk',
          language: 'EN',
          title: getTitle(),
          description: getDescription(),
          speaker: getSpeaker(),
        }),
        new AgendaItemEntity({
          startsAt: '22:00',
          endsAt: '22:00',
          type: 'closing',
        }),
      );

      return meetup;
    });

  return meetups;
}
