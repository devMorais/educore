import { Component, Input } from '@angular/core';
import type { MindMapNode } from '../../../core/models/content.models';

@Component({
  selector: 'app-mindmap-node',
  standalone: true,
  imports: [],
  template: `
    <div class="mm-node" [class]="'mm-node--level-' + level">
      <div class="mm-node__label">{{ node.topic }}</div>
      @if (node.children?.length) {
        <div class="mm-node__children">
          @for (child of node.children; track child.id) {
            <app-mindmap-node [node]="child" [level]="level + 1"></app-mindmap-node>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .mm-node { position: relative; padding-left: 1.5rem; margin: 0.4rem 0; }
    .mm-node--level-0 { padding-left: 0; }
    .mm-node__label {
      display: inline-block;
      padding: 0.35rem 0.75rem;
      border-radius: 20px;
      font-weight: 500;
      cursor: default;
    }
    .mm-node--level-0 .mm-node__label { background: #065A82; color: #fff; font-size: 1.1rem; font-weight: 700; }
    .mm-node--level-1 .mm-node__label { background: #1C7293; color: #fff; }
    .mm-node--level-2 .mm-node__label { background: #CAF0F8; color: #0D1B2A; }
    .mm-node--level-3 .mm-node__label { background: #f0f4f8; color: #2D4356; font-size: 0.9rem; }
    .mm-node__children { border-left: 2px solid #00B4D8; margin-left: 0.8rem; padding-left: 0.5rem; }
  `],
})
export class MindmapNode {
  @Input({ required: true }) node!: MindMapNode;
  @Input() level = 0;
}
