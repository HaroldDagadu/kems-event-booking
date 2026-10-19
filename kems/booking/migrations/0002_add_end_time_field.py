# Add end_time field as nullable initially

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('booking', '0001_initial'),
    ]

    operations = [
        # Add the end_time field as nullable
        migrations.AddField(
            model_name='bookingrequest',
            name='end_time',
            field=models.TimeField(help_text='The end time of the event', null=True, blank=True),
        ),
    ]