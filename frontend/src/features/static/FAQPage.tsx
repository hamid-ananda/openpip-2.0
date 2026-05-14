import type { CSSProperties, ReactNode } from 'react'

const ExternalLink = ({ href, children }: { href: string; children: ReactNode }) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    style={{ color: 'var(--primary)', textDecoration: 'none' }}
  >
    {children}
  </a>
)

const FAQS: { q: string; a: ReactNode }[] = [
  {
    q: 'Where does the interaction data available for search and download on this web portal come from?',
    a: (
      <>
        <p>
          The interaction data comes from two sources. The majority comes from a series of systematic
          screens of human open reading frame (ORF) clone collections performed in the Vidal,
          Tavernier and Roth labs at Dana-Farber Cancer Institute/Harvard Medical School, Vlaams
          Instituut voor Biotechnologie/Ghent University and University of Toronto, respectively.
          These interactions were found using a systematic binary mapping pipeline based upon a
          high-throughput yeast two-hybrid assay as the primary screen, followed by pairwise
          retesting in quadruplicate of all primary pairs, and subsequent validation of a random
          subset using two or more orthogonal assays.
        </p>
        <p>
          The remainder of the data are from databases of curated interactions reported in the
          literature. The publicly available interaction data was filtered to identify the
          high-quality binary interactions as described in the HuRI paper.
        </p>
      </>
    ),
  },
  {
    q: 'Does the interaction data originate from experiments and/or predictions?',
    a: 'All of the systematic data come from our systematic experimental screening pipeline and have at least one piece of supporting experimental evidence. This systematic dataset has been shown to have quality (fraction correct) that is on par with high-quality literature curated binary interactions, defined by having at least two pieces of experimental evidence from original publications, curated from the literature.',
  },
  {
    q: 'Why is the number of interactions for a given dataset different from the number reported in the original publication?',
    a: 'We map our ORF sequences to GENCODE (v27) gene annotation models to identify the gene, transcript, and protein to which our ORF belongs to. Because the genome is highly redundant, and genome annotation is difficult, there are changes between different GENCODE versions which can result in changes in the genes and proteins to which our ORFs map best. Furthermore, we only provide interactions for ORFs that, based on the gene annotation model, map to protein coding genes. The identification of which genes encode proteins is also subject to change between different gene annotation models.',
  },
  {
    q: 'I have my query genes in a different identifier format (neither gene symbols nor Uniprot IDs). What can I do to still use them as query on this web portal?',
    a: (
      <p>
        Currently our portal can only be searched using either gene symbols or UniProt accession
        numbers. You can convert your list of query genes into gene symbols or UniProt IDs at{' '}
        <ExternalLink href="https://www.uniprot.org/uploadlists/">UniProt ID mapping</ExternalLink>{' '}
        or{' '}
        <ExternalLink href="http://david.ncifcrf.gov/conversion.jsp">DAVID</ExternalLink>.
      </p>
    ),
  },
  {
    q: 'Why does my search not return any PPIs?',
    a: (
      <>
        <p>
          We have tested the ORFs corresponding to over 17,000 human protein-coding genes using our
          binary interaction mapping pipeline (a full list of the genes we have tested is available
          at{' '}
          <ExternalLink href="http://horfdb.dfci.harvard.edu/">horfdb.dfci.harvard.edu</ExternalLink>
          ). However, we may not have screened your gene of interest yet because we do not currently
          have an ORF clone available for this gene.
        </p>
        <p>
          The other possibility is that even though we have screened for PPIs with an ORF from your
          gene of interest, the expressed protein may not have resulted in any PPIs. While our
          binary interaction mapping pipeline is designed to be systematic and unbiased, there are
          some proteins which may prove to be refractory to the assays used. For example, (i)
          proteins that are secreted, are intrinsic membrane proteins or require significant
          post-translational modification may not form stable interactions under our assay
          conditions, (ii) some human proteins may be unstable or not fold correctly when expressed
          in yeast, (iii) some proteins may only interact as parts of large complexes and not as
          binary pairs, or (iv) some proteins may be incapable of interaction due, e.g., to errors
          or natural sequence variation in the clones, or due to the influence of the fused tags.
        </p>
      </>
    ),
  },
  {
    q: 'What would be a good confidence score cutoff to filter the interactions?',
    a: 'All CCSB datasets have been validated of their high biophysical quality by testing random subsets of PPIs in independent assays. The confidence score is intended to further rank the identified interactions, for example in cases where too many PPIs result and only a subset of all identified interactions can be used for experimental follow-up. In that sense, a cutoff can be defined based on the number of interactions that a user wants to consider. This score quantifies only a small part of the variance in biophysical quality within the dataset and therefore should not be used to discard PPIs for quality concerns.',
  },
  {
    q: 'In which format do I need to save the search results for upload into Cytoscape?',
    a: 'To upload the search results into Cytoscape, export them as a .csv file.',
  },
  {
    q: 'Why is there not a confidence score for every PPI?',
    a: 'The confidence score of a pair is calculated based on several features of how the interaction was detected during screening. This data is only available for pairs detected in the most recent screens (HuRI), and hence we are only able to calculate confidence scores for these pairs.',
  },
  {
    q: 'How should I cite the interaction data and web portal?',
    a: 'Please cite: Helmy et al., Journal of Molecular Biology, 2022.',
  },
  {
    q: 'How can I get information on the clone used to identify an interaction returned from my search?',
    a: 'The clones used in our screens come from the Human ORFeome clone collection assembled at CCSB and via the ORFeome Collaboration. Clicking the ORF identifiers will redirect the user to our ORFeome web portal where details on the cloning strategy, source material and nucleotide sequence are provided.',
  },
  {
    q: 'How can I get detailed experimental information on an interaction of interest?',
    a: 'By clicking on the edge that represents the interaction of interest in the network visualization on the results page, the user can obtain information on the individual experiments in which that interaction was identified along with information on the corresponding ORF identities.',
  },
  {
    q: "Isn't yeast two-hybrid data full of false positives?",
    a: (
      <>
        <p>
          Like any other experimental approach, the quality of the data generated is dependent on
          the careful design of the experiment and rigorous attention to detail in performing the
          experiments. We first remove all proteins which can autoactivate the yeast reporter genes
          (i.e., a single protein (as bait or prey in Y2) is able to induce reporter gene expression
          in the absence of any other partner protein). In addition, our modern binary interaction
          mapping pipeline contains numerous quality control measures implemented after primary
          screening, including pairwise verification (regenerating and retesting mated diploids from
          fresh glycerol stocks) and sequencing to confirm ORF identity. A random sample of verified
          primary yeast two-hybrid datasets are validated by testing a subset of interactions in at
          least two orthogonal assays that have been calibrated using positive and random reference
          sets. We only consider a dataset validated if the biophysical quality of the dataset is
          equal to, or greater than, a representative sample of interactions selected from the
          literature.
        </p>
        <p>
          We note that this process can establish that our interactions are of high biophysical
          quality, meaning that the reported pair of proteins is highly likely to interact when both
          proteins are expressed together. The assays employed however, cannot inform on whether the
          identified interactions are physiologically or biologically relevant. Demonstrating such
          relevance for an individual PPI requires an additional battery of molecular and cellular
          assays, which we are unable to perform on the more than 60,000 PPIs reported. However, we
          show that our datasets are highly enriched in linking proteins of similar functional
          annotation compared to random networks and in follow-up studies we provide evidence for
          the functional relevance of a number of PPIs (see our published work). Integration of Y2H
          interactome data with current data on contextual gene and protein expression and protein
          localization data can prioritize PPIs that are more likely to be physiologically relevant
          in the selected cellular context. However, one should not necessarily rule out any PPI in
          our dataset because of lack of contextual data due to the overall incompleteness of those
          datasets.
        </p>
      </>
    ),
  },
  {
    q: 'How complete is your map?',
    a: 'Estimating the level of completeness of our interactome data is difficult given how little we know about the composition of the human protein interactome and methodological biases associated with all interactome mapping assays including Y2H. As described in our HuRI paper, we estimate that HuRI currently covers 2-11% of the human binary protein interactome. Part of the PPIs that we are missing are those that depend on post-translational modifications that the yeast cell does not catalyze (at least under the conditions we used). Furthermore, our estimate of interactome coverage is only valid for binary protein interactions, and therefore does not include PPIs that depend on additional interaction partners (cooperative binding) and protein interactions that represent indirect associations in protein complexes. Complementary interactome mapping efforts, e.g., affinity purification followed by mass spectrometry, that can also be implemented at human proteome scale are needed to further complement and complete the binary interaction maps we provide.',
  },
  {
    q: 'Is your dataset depleted for protein interactions that are part of stable protein complexes?',
    a: 'By integrating our data with three dimensional structural information from protein complexes we observed that our interaction detection platform can detect interactions that are part of stable protein complexes across a wide range of protein complex sizes and we only observe a mild depletion for very large protein complexes (30+ subunits).',
  },
  {
    q: 'How do the various datasets available for download relate to each other?',
    a: 'The full descriptions of all various datasets in the "Dataset Downloads" page can be found in the "About" page. "HI-union" is the union of all published datasets (i.e. HI-I-05, HI-II-14, HuRI, Venkatesan-09, Yu-11, Yang-16, and Test space screens-19) except Lit-BM. The total number of PPIs and proteins listed on the homepage is the union of all datasets, published and unpublished.',
  },
  {
    q: 'How was this project funded?',
    a: (
      <>
        <p>
          This work was primarily supported by a National Institutes of Health (NIH) National Human
          Genome Research Institute (NHGRI) grant U41HG001715 with additional support from NIH
          grants P50HG004233, U01HL098166, U01HG007690, R01GM109199, Canadian Institute for Health
          Research (CIHR) Foundation Grants, the Canada Excellence Research Chairs Program and an
          American Heart Association grant 15CVGPS23430000.
        </p>
        <p>For further information, please see the acknowledgement section of the HuRI paper.</p>
      </>
    ),
  },
]

const answerStyle: CSSProperties = {
  fontSize: 14,
  color: 'var(--text-muted)',
  lineHeight: 1.7,
  margin: 0,
}

export function FAQPage() {
  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '48px 32px 80px' }}>
      <h1
        style={{
          fontSize: 28,
          fontWeight: 600,
          letterSpacing: '-.02em',
          color: 'var(--text)',
          margin: '0 0 40px',
        }}
      >
        Frequently Asked Questions
      </h1>

      <dl style={{ margin: 0, padding: 0 }}>
        {FAQS.map(({ q, a }, i) => (
          <div
            key={i}
            style={{
              borderTop: '1px solid var(--border)',
              padding: '24px 0',
            }}
          >
            <dt
              style={{
                fontSize: 15,
                fontWeight: 600,
                color: 'var(--text)',
                marginBottom: 10,
                lineHeight: 1.45,
              }}
            >
              {q}
            </dt>
            <dd style={{ margin: 0 }}>
              {typeof a === 'string' ? (
                <p style={answerStyle}>{a}</p>
              ) : (
                <div className="faq-answer" style={answerStyle}>{a}</div>
              )}
            </dd>
          </div>
        ))}
        <div style={{ borderTop: '1px solid var(--border)' }} />
      </dl>
    </div>
  )
}
