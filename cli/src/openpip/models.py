from __future__ import annotations
from typing import Optional, Any
from pydantic import BaseModel, ConfigDict, Field
from pydantic.aliases import AliasChoices


class Protein(BaseModel):
    model_config = ConfigDict(extra="allow", populate_by_name=True)
    id: Optional[int] = Field(None, validation_alias=AliasChoices("protein_id", "id"))
    gene_name: Optional[str] = Field(None, validation_alias=AliasChoices("protein_gene_name", "gene_name"))
    protein_name: Optional[str] = Field(None, validation_alias=AliasChoices("protein_protein_name", "protein_name"))
    uniprot_id: Optional[str] = Field(None, validation_alias=AliasChoices("protein_uniprot_id", "uniprot_id"))
    ensembl_id: Optional[str] = Field(None, validation_alias=AliasChoices("protein_ensembl_id", "ensembl_id"))
    entrez_id: Optional[str] = Field(None, validation_alias=AliasChoices("protein_entrez_id", "entrez_id"))
    description: Optional[str] = Field(None, validation_alias=AliasChoices("protein_description", "description"))
    number_of_interactions_in_database: Optional[int] = None


class Interaction(BaseModel):
    model_config = ConfigDict(extra="allow", populate_by_name=True)
    id: Optional[int] = Field(None, validation_alias=AliasChoices("interaction_id", "id"))
    interactor_A: Protein
    interactor_B: Protein
    score: Optional[Any] = None


class Dataset(BaseModel):
    model_config = ConfigDict(extra="allow", populate_by_name=True)
    id: int
    name: Optional[str] = None
    author: Optional[str] = Field(None, validation_alias=AliasChoices("dataset_author", "author"))
    year: Optional[str] = None
    description: Optional[str] = None


class NetworkNode(BaseModel):
    model_config = ConfigDict(extra="allow")
    data: dict[str, Any]


class NetworkEdge(BaseModel):
    model_config = ConfigDict(extra="allow")
    data: dict[str, Any]


class NetworkData(BaseModel):
    nodes: list[NetworkNode]
    edges: list[NetworkEdge]
