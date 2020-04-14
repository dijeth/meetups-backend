import {
  Injectable,
  NotFoundException,
  NotImplementedException,
} from '@nestjs/common';
import { MeetupWithAgendaDto } from './dto/meetup-with-agenda.dto';
import { MeetupDto } from './dto/meetup.dto';
import { InjectRepository } from 'nestjs-mikro-orm';
import { MeetupEntity } from './entities/meetup.entity';
import { EntityManager, EntityRepository } from 'mikro-orm';
import { UserEntity } from '../users/user.entity';
import { AbstractSqlConnection } from 'mikro-orm/dist/connections/AbstractSqlConnection';
import { AgendaItemEntity } from './entities/agenda-item.entity';
import { CreateMeetupDto } from './dto/create-meetup.dto';

@Injectable()
export class MeetupsService {
  constructor(
    private readonly em: EntityManager,

    @InjectRepository(MeetupEntity)
    private readonly meetupsRepository: EntityRepository<MeetupEntity>,
  ) {}

  async findAll(user?: UserEntity): Promise<MeetupDto[]> {
    const meetups = user
      ? await this.getMeetupsForUser(user)
      : await this.meetupsRepository.findAll();

    await this.em.populate(meetups, 'organizer');
    return meetups.map((meetup) => new MeetupDto(meetup));
  }

  private async getMeetupsForUser(user: UserEntity): Promise<MeetupEntity[]> {
    const knex = (this.em.getConnection() as AbstractSqlConnection).getKnex();
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

  async findById(
    meetupId: number,
    user?: UserEntity,
  ): Promise<MeetupWithAgendaDto> {
    const meetup = await this.meetupsRepository.findOne(meetupId, true);
    if (!meetup) {
      throw new NotFoundException();
    }
    if (user) {
      if (meetup.organizer.id === user.id) {
        meetup.organizing = true;
      }
      if (meetup.participants.contains(user)) {
        meetup.attending = true;
      }
    }
    return new MeetupWithAgendaDto(meetup);
  }

  async createMeetup(
    meetupDto: CreateMeetupDto,
    organizer: UserEntity,
  ): Promise<MeetupWithAgendaDto> {
    this.em.merge(organizer);
    const meetup = new MeetupEntity(meetupDto);
    const meetupEvents = meetupDto.agenda.map(
      (agendaDto) => new AgendaItemEntity(agendaDto),
    );
    meetup.agenda.set(meetupEvents);
    meetup.organizer = organizer;
    await this.meetupsRepository.persistAndFlush(meetup);
    return new MeetupWithAgendaDto(meetup);
  }

  async updateMeetup(
    meetupId: number,
    meetup: MeetupWithAgendaDto,
  ): Promise<MeetupWithAgendaDto> {
    throw new NotImplementedException();
    return meetup;
  }

  async deleteMeetup(meetupId: number) {
    const meetup = await this.meetupsRepository.findOne(meetupId);
    return this.meetupsRepository.removeAndFlush(meetup);
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
