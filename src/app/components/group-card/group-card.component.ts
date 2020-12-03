import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {DatabaseUserModel, GroupModel} from '../../models/models';

@Component({
  selector: 'app-group-card',
  templateUrl: './group-card.component.html',
  styleUrls: ['./group-card.component.css']
})
export class GroupCardComponent implements OnInit {
  @Input() group: GroupModel;
  @Input() option?: string;
  @Output() selected_chat: EventEmitter<GroupModel> = new EventEmitter();
  constructor() { }

  ngOnInit() {
  }

  doSelectChat() {
    this.selected_chat.emit(this.group);
  }
}
