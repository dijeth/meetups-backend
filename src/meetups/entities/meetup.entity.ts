import {
  Cascade,
  Collection,
  Entity,
  ManyToMany,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryKey,
  Property,
} from '@mikro-orm/core';
import { UserEntity } from '../../users/user.entity';
import { AgendaItemEntity } from './agenda-item.entity';
import { CreateMeetupDto } from '../dto/create-meetup.dto';
import { ImageEntity } from '../../images/image.entity';

@Entity({ tableName: 'meetups' })
export class MeetupEntity {
  @PrimaryKey()
  id!: number;

  @Property()
  title!: string;

  @Property()
  description?: string;

  @Property()
  date!: Date;

  @Property()
  place!: string;

  @OneToOne({
    cascade: [Cascade.PERSIST, Cascade.MERGE, Cascade.REMOVE],
  })
  image?: ImageEntity;

  @ManyToOne(() => UserEntity)
  organizer!: UserEntity;

  @OneToMany({
    entity: () => AgendaItemEntity,
    mappedBy: (agendaEvent) => agendaEvent.meetup,
    cascade: [Cascade.PERSIST, Cascade.MERGE, Cascade.REMOVE],
  })
  agenda = new Collection<AgendaItemEntity>(this);

  @ManyToMany({
    entity: () => UserEntity,
    pivotTable: 'participation',
    joinColumn: 'meetup_id',
    inverseJoinColumn: 'user_id',
    cascade: [Cascade.PERSIST, Cascade.MERGE],
  })
  participants = new Collection<UserEntity>(this);

  @Property({ persist: false })
  organizing?: boolean = false;

  @Property({ persist: false })
  attending?: boolean = false;

  constructor(meetupDto: Partial<CreateMeetupDto>) {
    this.title = meetupDto.title;
    this.description = meetupDto.description;
    this.place = meetupDto.place;

    this.date = new Date(meetupDto.date);
    this.date.setUTCHours(0, 0, 0, 0);
  }
}
