import { Component, Input, ElementRef, OnInit, OnChanges, ViewChild, SimpleChanges } from '@angular/core';
import { DygraphOptions } from './dygraphOptions';

declare const Dygraph: any;

@Component({
  selector: 'ng-dygraphs',
  templateUrl: 'ng-dygraphs.component.html',
  styleUrls: ['ng-dygraphs.component.css']
})
/**
 * Wrapper arround Dygraphs
 *
 * @class NgDygraphsComponent
 */
export class NgDygraphsComponent implements OnInit, OnChanges {
  @Input() public options: DygraphOptions;
  @Input() public data: any;
  @Input() public customVisibility: boolean;
  @Input() public noDataLabel: string;
  @ViewChild('chart') public chart: ElementRef;

  public loadingInProgress: boolean;
  public chartWidth: number;
  public chartHeight: number;
  public labels: string[];

  public dygraph: any;

  public ngOnInit() {
    this.noDataLabel =  this.noDataLabel  || 'NO DATA AVAILABLE';
    this.chartWidth = (this.options && this.options.width) || 640;
    this.chartHeight = (this.options && this.options.height) || 480;
  }

  /**
   * ngOnChanges
   * @method ngOnChanges
   * @return {void}
   */
  public ngOnChanges(changes: SimpleChanges) {

    if (!changes) {
      return;
    }

    if (!this.data || !this.data.length) {
      this.loadingInProgress = false;
      return;
    }

    this.loadingInProgress = true;

    const options = Object.assign({}, this.options);

    if (!options.width) { options.width = this.chartWidth; }
    if (!options.height) { options.height = this.chartHeight; }
    if (!options.legend) { options.legend = 'always'; }

    const initialVisibility: boolean[] = [];
    if (options.labels) {
      if (this.customVisibility && options.labels.length > 1) {
        // options.labels[0] is always X axis
        this.labels = options.labels.slice(1);
      }

      options.labels.forEach((_) => {
        initialVisibility.push(true);
      });
    }
    if (options.labels) { options.visibility = initialVisibility; }

    setTimeout(() => {
      this.dygraph = new Dygraph(this.chart.nativeElement,
        this.data,
        options
      );
      this.loadingInProgress = false;
      this.dygraph.ready(graph => {
        this.watchRangeSelector(graph);
      });
    }, 500);
  }

  public changeVisibility(el: any) {
    const elem = el.currentTarget;
    this.dygraph.setVisibility(parseInt(elem.id, 10), elem.checked);
  }

  private watchRangeSelector(graph) {
    const observer = new MutationObserver(function (mutations) { // called on style changes of range selector handles
      if (mutations.length === 2) { // both range selector handles have style changed -> assume move
        // Zoom to the same zoom to trigger zoomCallback
        const zoomCallback = graph.getFunctionOption('zoomCallback');
        const [minX, maxX] = graph.xAxisRange();
        zoomCallback.call(graph, minX, maxX, graph.yAxisRanges());
      }
    });
    Array.from(document.getElementsByClassName('dygraph-rangesel-zoomhandle')).forEach(
      // work on range selector handles
      function (element, idx, arr) {
        // watch for style changes
        observer.observe(element, { attributes: true, attributeFilter: ['style'] });
      }
    );
  }
}
