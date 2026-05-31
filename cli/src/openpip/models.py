from __future__ import annotations
from typing import Optional, Any
from pydantic import BaseModel, ConfigDict


class Protein(BaseModel):
    model_config = ConfigDict(extra="allow")
    id: int
    gene_name: Optional[str] = None
    protein_name: Optional[str] = None
    uniprot_id: Optional[str] = None
    ensembl_id: Optional[str] = None
    entrez_id: Optional[str] = None
    description: Optional[str] = None
    number_of_interactions_in_database: Optional[int] = None


class Interaction(BaseModel):
    model_config = ConfigDict(extra="allow")
    id: int
    interactor_A: Protein
    interactor_B: Protein
    score: Optional[str] = None
    binding_start: Optional[str] = None
    binding_end: Optional[str] = None


class Dataset(BaseModel):
    model_config = ConfigDict(extra="allow")
    id: int
    name: Optional[str] = None
    pubmed_id: Optional[str] = None
    author: Optional[str] = None
    year: Optional[str] = None
    description: Optional[str] = None
    number_of_interactions: Optional[str] = None


class NetworkNode(BaseModel):
    model_config = ConfigDict(extra="allow")
    data: dict[str, Any]


class NetworkEdge(BaseModel):
    model_config = ConfigDict(extra="allow")
    data: dict[str, Any]


class NetworkData(BaseModel):
    nodes: list[NetworkNode]
    edges: list[NetworkEdge]
