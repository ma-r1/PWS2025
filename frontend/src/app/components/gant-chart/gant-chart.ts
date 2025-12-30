import { Component, Input, ViewChild, OnChanges, SimpleChanges, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartOptions, ChartType } from 'chart.js';
import 'chart.js/auto';

import { Task } from '../../models/task'; 
import { Team } from '../../models/team';

@Component({
  selector: 'gant-chart',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  templateUrl: './gant-chart.html',
  styleUrls: [ './gant-chart.scss' ]
})

export class GantChart implements OnChanges {

  @Input() tasks: Task[] = [];
  @Input() teams: Team[] = [];

  @ViewChild(BaseChartDirective) chart?: BaseChartDirective;
  @HostListener('window:resize')
    onResize() {
    this.chart?.chart?.resize();
  }

  chartType: ChartType = 'bar';
  chartData: ChartConfiguration<'bar'>['data'] = {
    labels: [],
    datasets: [
      {
        label: 'Gantt Chart',
        data: [],
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        barPercentage: 0.5,
      }
    ]
  };

  chartOptions: ChartConfiguration<'bar'>['options'] = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        position: 'top',
        beginAtZero: false,
        max: Date.now(),
        ticks: {
          callback: function(value) {
            return new Date(value as number).toLocaleDateString();
          },
        maxRotation: 45,
        minRotation: 0 
        }
      },
      y: {
        ticks: {
          autoSkip: false,
        }
      }
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => {
            const raw = context.raw as [number, number];
            const startDate = new Date(raw[0]).toLocaleDateString();
            const endDate = new Date(raw[1]).toLocaleDateString();
            const isOngoing = raw[1] >= new Date().setHours(0,0,0,0);
            if(isOngoing) {
              return ` ${startDate} - Today`;
            }
            return ` ${startDate} - ${endDate}`;
          }
        }
      }
    }
  };

  ngOnChanges(changes: SimpleChanges): void {
    if (this.tasks && this.teams && (changes['tasks'] || changes['teams'])) {
      this.updateChartData();
    }
  }

  public updateChartData() {
    if (!this.tasks.length) return;

    const today = new Date().getTime();

    const startDates = this.tasks.map( task => new Date(task.start_date).getTime()).filter(task => !isNaN(task));

    const minDate = Math.min(...startDates);

    if (this.chartOptions?.scales?.['x']){
      this.chartOptions.scales['x'].min = minDate;
      this.chartOptions.scales['x'].max = today;
    }

    const teamColorMap: Record<number, string> = {};
    this.teams.forEach(team => teamColorMap[team.id] = team.color);

    const labels: string[] = [];
    const floatingData: any[] = [];
    const colors: string[] = [];

    this.tasks.forEach(task => {
      const start = new Date(task.start_date).getTime();
      let end = task.end_date ? new Date(task.end_date).getTime() : today;
      
      if (!isNaN(start)) {
        labels.push(task.name);
        floatingData.push([start, end]);
        colors.push(teamColorMap[task.team_id] || 'rgba(75, 192, 192, 0.5)');
      }
    });

    this.chartData.labels = labels;
    this.chartData.datasets[0].data = floatingData;
    this.chartData.datasets[0].backgroundColor = colors;

    this.chart?.update();
  }

}
