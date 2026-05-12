import factory
from datasets.models import Dataset


class DatasetFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Dataset

    name = factory.Sequence(lambda n: f"Dataset{n}")
    pubmed_id = factory.Sequence(lambda n: f"{2000000 + n}")
    author = factory.Sequence(lambda n: f"Author{n} et al.(2020)")
    year = "2020"
    interaction_status = "Published"
    description = "Test dataset"
    number_of_interactions = "100"
