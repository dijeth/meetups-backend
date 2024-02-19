import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityManager, EntityRepository } from '@mikro-orm/core';
import { SqliteConnection } from '@mikro-orm/sqlite/SqliteConnection';
import { MeetupEntity } from './entities/meetup.entity';
import { AgendaItemEntity } from './entities/agenda-item.entity';
import { CreateMeetupDto } from './dto/create-meetup.dto';
import { UserEntity } from '../users/user.entity';
import { ImageEntity } from '../images/image.entity';

@Injectable()
export class MeetupsService {
  constructor(
    private readonly em: EntityManager,

    @InjectRepository(MeetupEntity)
    private readonly meetupsRepository: EntityRepository<MeetupEntity>,

    @InjectRepository(AgendaItemEntity)
    private readonly agendaRepository: EntityRepository<AgendaItemEntity>,

    @InjectRepository(ImageEntity)
    private readonly imagesRepository: EntityRepository<ImageEntity>,
  ) {}

  async findAll(user?: UserEntity): Promise<MeetupEntity[]> {
    const meetups = user
      ? await this.getMeetupsForUser(user)
      : await this.meetupsRepository.findAll();

    await this.em.populate(meetups, 'image');
    await this.em.populate(meetups, 'organizer');
    await this.em.populate(meetups, 'agenda');
    return meetups;
  }

  private async getMeetupsForUser(user: UserEntity): Promise<MeetupEntity[]> {
    const knex = (this.em.getConnection() as SqliteConnection).getKnex();
    const result = await knex
      .select(
        '*',
        knex.raw('meetups.organizer_id = ? as organizing', [user.id]),
        knex('participation')
          .count('*')
          .where('user_id', user.id)
          .andWhere('meetup_id', knex.ref('id').withSchema('meetups'))
          .as('attending'),
      )
      .from('meetups');
    return result.map((meetup) => this.meetupsRepository.map(meetup));
  }

  async findById(meetupId: number, user?: UserEntity): Promise<MeetupEntity> {
    const meetup = await this.meetupsRepository.findOne(meetupId, true);
    if (!meetup) {
      throw new NotFoundException();
    }
    if (user) {
      if (meetup.organizer.id === user.id) {
        meetup.organizing = true;
      }
      // This doesn't work...
      // if (meetup.participants.contains(user)) {
      if (meetup.participants.getItems().find((it) => it.id === user.id)) {
        meetup.attending = true;
      }
    }
    return meetup;
  }

  async createMeetup(
    meetupDto: CreateMeetupDto,
    organizer: UserEntity,
  ): Promise<MeetupEntity> {
    this.em.merge(organizer);
    const meetup = new MeetupEntity(meetupDto);
    meetup.agenda.set(
      meetupDto.agenda.map((agendaDto) => new AgendaItemEntity(agendaDto)),
    );
    meetup.organizer = organizer;
    if (meetupDto.imageId) {
      meetup.image = await this.imagesRepository.findOne({
        id: meetupDto.imageId,
        user: organizer.id,
      });
    }
    await this.meetupsRepository.persistAndFlush(meetup);
    return meetup;
  }

  async updateMeetup(
    meetupId: number,
    newMeetup: CreateMeetupDto,
    organizer: UserEntity,
  ): Promise<MeetupEntity> {
    this.em.merge(organizer);
    // TODO: not the best solution and not dry
    const meetup = await this.meetupsRepository.findOne(meetupId, ['agenda']);
    if (!meetup) {
      throw new NotFoundException();
    }
    meetup.title = newMeetup.title;
    meetup.description = newMeetup.description;
    meetup.place = newMeetup.place;
    meetup.date = new Date(newMeetup.date);
    meetup.date.setUTCHours(0, 0, 0, 0);
    if (newMeetup.imageId) {
      meetup.image = await this.imagesRepository.findOne({
        id: newMeetup.imageId,
        user: organizer.id,
      });
    } else if (meetup.image) {
      this.imagesRepository.remove(meetup.image);
      meetup.image = null;
    }
    meetup.agenda.getItems().forEach((agendaItem) => {
      this.agendaRepository.remove(agendaItem);
    });
    meetup.agenda.set(
      newMeetup.agenda.map((agendaDto) => new AgendaItemEntity(agendaDto)),
    );
    await this.em.flush();
    return meetup;
  }

  async deleteMeetup(meetupId: number) {
    const meetup = await this.meetupsRepository.findOne(meetupId, [
      'agenda',
      'participants',
      'image',
    ]);
    if (meetup) {
      return this.meetupsRepository.removeAndFlush(meetup);
    }
  }

  async attendMeetup(meetupId: number, user: UserEntity) {
    this.em.merge(user);
    const meetup = await this.meetupsRepository.findOne(meetupId, true);
    if (!meetup) {
      throw new NotFoundException();
    }
    meetup.participants.add(user);
    return this.meetupsRepository.flush();
  }

  async leaveMeetup(meetupId: number, user: UserEntity) {
    this.em.merge(user);
    const meetup = await this.meetupsRepository.findOne(meetupId, true);
    if (!meetup) {
      throw new NotFoundException();
    }
    if (meetup.participants.contains(user)) {
      meetup.participants.remove(user);
    }

    return this.meetupsRepository.flush();
  }
}
