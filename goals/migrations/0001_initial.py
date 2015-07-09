# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations
from django.conf import settings


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Goal',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('name', models.CharField(max_length=200)),
                ('start', models.DateField(verbose_name=b'start date')),
                ('end', models.DateField(verbose_name=b'end date')),
                ('total', models.IntegerField()),
                ('user', models.ForeignKey(to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.CreateModel(
            name='ProgressLog',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('date', models.DateField(verbose_name=b'entry date')),
                ('progress', models.IntegerField()),
                ('goal', models.ForeignKey(to='goals.Goal')),
            ],
        ),
        migrations.AlterUniqueTogether(
            name='progresslog',
            unique_together=set([('goal', 'date')]),
        ),
        migrations.AlterUniqueTogether(
            name='goal',
            unique_together=set([('user', 'name')]),
        ),
    ]
