import factory
from interactions.models import (
    Interaction,
    InteractionCategory,
    InteractionDataset,
    InteractionInteractionCategory,
)
from proteins.tests.factories import ProteinFactory


class InteractionCategoryFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = InteractionCategory

    category_name = "Published"
    order = "1"
    selected_by_default = "1"
    include_in_home_page_count = "1"


class InteractionFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Interaction

    interactor_A = factory.SubFactory(ProteinFactory)
    interactor_B = factory.SubFactory(ProteinFactory)
    score = "0.75"
    removed = "0"


class InteractionDatasetFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = InteractionDataset

    interaction = factory.SubFactory(InteractionFactory)


class InteractionInteractionCategoryFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = InteractionInteractionCategory

    interaction = factory.SubFactory(InteractionFactory)
    interaction_category = factory.SubFactory(InteractionCategoryFactory)
