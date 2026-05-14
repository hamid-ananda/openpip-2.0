import type { CSSProperties, ReactNode } from 'react'
import { useSettings } from '../../api/settings'

const ExternalLink = ({ href, children }: { href: string; children: ReactNode }) => (
  <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', textDecoration: 'none' }}>
    {children}
  </a>
)

const h2Style: CSSProperties = {
  fontSize: 20,
  fontWeight: 600,
  letterSpacing: '-.01em',
  color: 'var(--text)',
  margin: '48px 0 16px',
  paddingTop: 24,
  borderTop: '1px solid var(--border)',
}

const h3Style: CSSProperties = {
  fontSize: 15,
  fontWeight: 600,
  color: 'var(--text)',
  margin: '24px 0 8px',
}

const pStyle: CSSProperties = {
  fontSize: 14,
  color: 'var(--text-muted)',
  lineHeight: 1.75,
  margin: '0 0 12px',
}

const tableStyle: CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: 13,
  margin: '16px 0 24px',
}

const thStyle: CSSProperties = {
  textAlign: 'left',
  padding: '8px 12px',
  fontWeight: 600,
  fontSize: 12,
  color: 'var(--text-muted)',
  background: 'var(--surface-2)',
  border: '1px solid var(--border)',
  whiteSpace: 'nowrap',
}

const tdStyle: CSSProperties = {
  padding: '8px 12px',
  color: 'var(--text)',
  border: '1px solid var(--border)',
  verticalAlign: 'top',
  lineHeight: 1.5,
}

export function AboutPage() {
  const { data: settings, isLoading } = useSettings()

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 200 }}>
        <div style={{
          width: 28,
          height: 28,
          borderRadius: '50%',
          border: '2px solid var(--border)',
          borderTopColor: 'var(--primary)',
          animation: 'spin .8s linear infinite',
        }} />
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 820, margin: '0 auto', padding: '48px 32px 80px' }}>
      <h1 style={{ fontSize: 28, fontWeight: 600, letterSpacing: '-.02em', color: 'var(--text)', margin: '0 0 32px' }}>
        About {settings?.title ?? 'openPIP'}
      </h1>

      <p style={pStyle}>
        At CCSB, the Human Reference Interactome Mapping Project has grown in several distinct stages
        primarily defined by the number of human protein-coding genes amenable to screening for which
        at least one Gateway-cloned Open Reading Frame (ORF) was available at the time of the project.
        As of today, three proteome-scale human PPI datasets are available via this web portal, in
        addition to other PPI datasets from CCSB, which were generated to optimize our pipeline, build
        a framework for quality control, benchmark new Y2H assay versions, or assess network rewiring
        as a result of alternative splicing (see below for more details).
      </p>
      <p style={pStyle}>
        We also make available a subset of the curated binary protein interactions from the scientific
        literature that is of comparable quality to interactions identified in systematic screens at CCSB.
      </p>
      <p style={pStyle}>
        All provided PPI datasets on this web portal have been processed using a new pipeline that maps
        our ORF sequences and resulting PPIs to Ensembl gene, transcript and protein identifiers that are
        annotated by the GENCODE consortium as protein-coding. As a result of this updated mapping,
        previously published datasets that are provided for download on this portal vary slightly in their
        number of PPIs compared to the protein interaction count provided in the original paper. The
        original datasets can be accessed in the supplementary material of each respective publication. We
        highly encourage users to use the updated datasets provided on this web portal for their research.
      </p>
      <p style={pStyle}>
        All datasets are available for download as simple tab-separated file with the interacting protein
        pairs being indicated as pairs of Ensembl gene IDs. All CCSB interaction data is also available
        for download in PSI-MI format containing detailed experimental information and isoform-specific
        ORF, transcript and protein identifiers for each interaction.
      </p>

      {/* ── Proteome-scale efforts ── */}
      <h2 style={h2Style}>CCSB Proteome-scale efforts</h2>

      <h3 style={h3Style}>HI-I-05</h3>
      <p style={pStyle}>
        Our first iteration at mapping the human protein interactome (Rual et al Nature 2005) screened a
        space (Space I) of ~8,000 ORFs corresponding to ~7,000 genes, and identified ~2,700 high-quality
        binary PPIs. This search space represents ~12% of the complete search space, assuming a total of
        ~20,000 protein-coding genes.
      </p>

      <h3 style={h3Style}>HI-II-14</h3>
      <p style={pStyle}>
        The second phase of the human interactome mapping project (Rolland et al Cell 2014) generated a
        dataset of ~14,000 binary PPIs following two screens of a matrix of ~13,000 x 13,000 proteins
        (Space II). This search space covers ~42% of the complete search space, a more than 3 fold
        increase with respect to our first attempt.
      </p>

      <h3 style={h3Style}>HuRI</h3>
      <p style={pStyle}>
        In the third phase of the project (Luck et al under review, BioRxiv) the human ORF collection
        being screened has been expanded to ~17,500 unique genes (Space III) and covers ~77% of the
        complete search space. ~53,000 PPIs identified from screening space III nine times with three
        variations of the Y2H assay are provided for search and download. This dataset is also referred
        to as HI-III-19.
      </p>

      <h3 style={h3Style}>HI-union</h3>
      <p style={pStyle}>
        HI-union is an aggregate of all PPIs identified in HI-I-05, HI-II-14, HuRI, Venkatesan-09,
        Yu-11, Yang-16, and Test space screens-19 (see below) transcript and protein identifiers for
        each interaction.
      </p>

      {/* ── Other efforts ── */}
      <h2 style={h2Style}>Other CCSB protein interaction mapping efforts</h2>

      <h3 style={h3Style}>Venkatesan-09</h3>
      <p style={pStyle}>
        To estimate the coverage and size of the human interactome (Venkatesan et al Nature Methods
        2009), four Y2H screens were performed on a set of ~1,800 DB-X fusion proteins (or baits,
        representing ~1,700 unique genes) against ~1,800 AD-Y proteins (or preys, representing ~1,800
        unique genes), corresponding to ~10% of the available genes and ~1% of the full search space.
        This dataset contains ~200 high-quality binary PPIs.
      </p>

      <h3 style={h3Style}>Yu-11</h3>
      <p style={pStyle}>
        To develop a novel Stitch-seq interactome mapping protocol, a Y2H screen was carried out inside
        Space II (Yu et al Nature Methods 2011). Stitch-seq combines PCR stitching with next-generation
        sequencing, and increases the efficiency and cost effectiveness of Y2H screening. The resulting
        dataset contains ~1,200 PPIs among proteins encoded by ~1,100 human genes.
      </p>

      <h3 style={h3Style}>Yang-16</h3>
      <p style={pStyle}>
        To assess the extent to which different protein isoforms generated by alternative splicing from
        the same gene perform different functions within the cell, we have successfully cloned multiple
        isoforms for 161 genes and screened those for PPIs against all human ORFs from space II (Yang et
        al Cell 2016). ~700 PPIs have been identified.
      </p>

      <h3 style={h3Style}>Test space screens-19</h3>
      <p style={pStyle}>
        To develop, optimize, and benchmark improvements to the mapping pipeline and variations of the
        Y2H assay, independent, reciprocal screens on a search space of ~1,800 x ~1,800 genes were
        completed, constituting ~1% of the full search space. In total, 1,159 PPIs have been identified
        in these screens and those have been published as part of the paper describing HuRI.
      </p>

      {/* ── Literature ── */}
      <h2 style={h2Style}>Literature</h2>

      <h3 style={h3Style}>Lit-BM</h3>
      <p style={pStyle}>
        Previously published work (Rolland et al Cell 2014) identified that a subset of the curated
        interactions from the scientific literature that have at least two pieces of experimental evidence
        (two different methods or two different papers) of which at least one stems from a binary protein
        interaction detection assay (Literature binary multiple = Lit-BM) retested at comparable rates in
        protein interaction detection assays compared to interactions identified in the CCSB screening
        efforts. Binary PPIs with only one piece of experimental evidence retested at significantly lower
        rate. Here, we provide an updated set of all PPIs in Lit-BM that we obtained from filtering and
        classifying PPIs from the Mentha resource. Details of the filtering and classification are
        described in the HuRI paper.
      </p>

      {/* ── Screening pipeline ── */}
      <h2 style={h2Style}>Description of the Y2H screening pipeline</h2>
      <p style={pStyle}>
        Details on our screening, pairwise test, and validation protocols are available as part of the
        HuRI paper and previously published protocols (Choi et al Methods Mol Biol 2018, Dreze et al
        Methods Enzymol 2010). Briefly, ORFs from the hORFeome collection were transferred into
        DNA-binding (DB) and activation domain (AD) Y2H destination vectors (see below). The vectors
        were consequently used to transform yeast strains (see below). Strong DB autoactivators were
        removed prior to screening. Yeast strains with 1,000 different AD-ORFs were pooled and mated
        with a single DB-ORF yeast strain. Growing yeast colonies were picked and sequenced to identify
        likely interacting pairs (First Pass Pairs = FiPPs). FiPPs were consequently individually tested
        in quadruplicate in a Y2H pairwise test and sequence confirmed resulting in a dataset of verified
        PPIs. A random subset of these verified PPIs are selected and tested in orthogonal protein
        interaction detection assays along with sets of known PPIs (positive control) and random pairs of
        proteins (negative control) to test for the quality of the identified PPIs. If found to be of
        high biophysical quality, the dataset is considered as validated and as such meets our criteria
        for publication. Of note, validation controls for the biophysical quality of the identified
        interactions. Dissecting the functional relevance of a given PPI requires extensive experimental
        follow-up.
      </p>

      {/* ── Vector details table ── */}
      <h3 style={h3Style}>Vector details</h3>
      <div style={{ overflowX: 'auto' }}>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Name</th>
              <th style={thStyle}>pDEST-DB</th>
              <th style={thStyle}>pDEST-AD-CHY2</th>
              <th style={thStyle}>pDEST-QZ213</th>
              <th style={thStyle}>pDEST-AD-AR68</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ ...tdStyle, fontWeight: 500, color: 'var(--text-muted)', background: 'var(--surface-2)' }}>Fusion</td>
              <td style={tdStyle}>Gal4-DB (aa 1-147)</td>
              <td style={tdStyle}>Gal4-AD (aa 768-881)</td>
              <td style={tdStyle}>Gal4-AD (aa 768-881)</td>
              <td style={tdStyle}>Gal4-AD (aa 768-881)</td>
            </tr>
            <tr>
              <td style={{ ...tdStyle, fontWeight: 500, color: 'var(--text-muted)', background: 'var(--surface-2)' }}>Fusion location</td>
              <td style={tdStyle}>N-term</td>
              <td style={tdStyle}>N-term</td>
              <td style={tdStyle}>N-term</td>
              <td style={tdStyle}>C-term</td>
            </tr>
            <tr>
              <td style={{ ...tdStyle, fontWeight: 500, color: 'var(--text-muted)', background: 'var(--surface-2)' }}>Promoter</td>
              <td style={tdStyle}>Truncated ADH1 promoter (-701 to +1)</td>
              <td style={tdStyle}>Truncated ADH1 promoter (-701 to +1)</td>
              <td style={tdStyle}>Truncated ADH1 promoter (-410 to +1)</td>
              <td style={tdStyle}>Truncated ADH1 promoter (-410 to +1)</td>
            </tr>
            <tr>
              <td style={{ ...tdStyle, fontWeight: 500, color: 'var(--text-muted)', background: 'var(--surface-2)' }}>Yeast replication ori</td>
              <td style={tdStyle}>CEN</td>
              <td style={tdStyle}>CEN</td>
              <td style={tdStyle}>2micron</td>
              <td style={tdStyle}>2micron</td>
            </tr>
            <tr>
              <td style={{ ...tdStyle, fontWeight: 500, color: 'var(--text-muted)', background: 'var(--surface-2)' }}>Linker</td>
              <td style={tdStyle}>SRSNQ</td>
              <td style={tdStyle}>GGSNQ</td>
              <td style={tdStyle}>ICMAYPYDVPDYASLGGHMAMEAPS</td>
              <td style={tdStyle}>VDGTA</td>
            </tr>
            <tr>
              <td style={{ ...tdStyle, fontWeight: 500, color: 'var(--text-muted)', background: 'var(--surface-2)' }}>Terminator</td>
              <td style={tdStyle}>ADH1 Term</td>
              <td style={tdStyle}>ADH1 Term</td>
              <td style={tdStyle}>ADH1 Term</td>
              <td style={tdStyle}>ADH1 Term</td>
            </tr>
            <tr>
              <td style={{ ...tdStyle, fontWeight: 500, color: 'var(--text-muted)', background: 'var(--surface-2)' }}>Selection marker</td>
              <td style={tdStyle}>AmpR</td>
              <td style={tdStyle}>AmpR</td>
              <td style={tdStyle}>AmpR</td>
              <td style={tdStyle}>AmpR</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ── Y2H assay versions table ── */}
      <h3 style={h3Style}>Y2H assay versions</h3>
      <p style={pStyle}>
        Combinations of different yeast strains and vectors result in different Y2H assay versions as
        described in the table below.
      </p>
      <p style={pStyle}>
        Assay version 0 was used to generate the datasets HI-I-05 and Venkatesan-09. Assay version 1
        was used to generate HI-II-14, Yu-11, Yang-16, some of the test space screens, and the screens
        1-3 of HuRI. Assay version 2 was used to generate screens 4-6 and some test space screens and
        assay version 3 for screens 7-9 of HuRI and some test space screens.
      </p>
      <div style={{ overflowX: 'auto' }}>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Assay version</th>
              <th style={thStyle}>DB vector</th>
              <th style={thStyle}>AD vector</th>
              <th style={thStyle}>DB yeast strain</th>
              <th style={thStyle}>AD yeast strain</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['0', 'pDEST-DB', 'pDEST-AD-CHY2', 'MaV203', 'MaV103'],
              ['1', 'pDEST-DB', 'pDEST-AD-CHY2', 'Y8930', 'Y8800'],
              ['2', 'pDEST-DB', 'pDEST-QZ213', 'Y8930', 'Y8800'],
              ['3', 'pDEST-DB', 'pDEST-AD-AR68', 'Y8930', 'Y8800'],
            ].map((row) => (
              <tr key={row[0]}>
                {row.map((cell, j) => (
                  <td key={j} style={{ ...tdStyle, fontFamily: j === 0 ? 'var(--mono)' : undefined }}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Search options ── */}
      <h2 style={h2Style}>Search options</h2>
      <p style={pStyle}>
        By default the search function of the web portal will return all query proteins with their
        interaction partners and all interactions between these proteins that have been identified in any
        of the PPI datasets described above. The results can be limited to interactions between query
        proteins and between query proteins and their interaction partners only. For larger queries and
        for cases when there is no need to display the results as network, the results can be directly
        retrieved as a data file.
      </p>

      {/* ── Filter options ── */}
      <h2 style={h2Style}>Filter options</h2>

      <h3 style={h3Style}>Confidence Score</h3>
      <p style={pStyle}>
        This score is intended to rank human binary protein-protein interactions (PPIs) identified in
        systematic screens at CCSB based on their biophysical quality. A random subset of PPIs (~5%)
        from all Y2H screens are tested in orthogonal binary PPI detection assays, such as MAPPIT and
        GPCA, to demonstrate the high overall quality of each screen prior to release. The confidence
        score can be used to further prioritize interactions for experimental follow-up wherever needed.
        The score is based on information from the Y2H experiments and retest rates of specific subsets
        of PPIs in MAPPIT and GPCA. The score is the output of a statistical model of the MAPPIT and
        GPCA tests, which corrects for lower retest rates as a result of differences in the experimental
        detectability of PPIs rather than differences in their biophysical quality (see HuRI paper on
        detectability of PPIs).
      </p>
      <p style={pStyle}>
        Specifically, the probability of a PPI testing positive in GPCA/MAPPIT data is modeled as being
        composed of two components, formulated as the regularized product of two logistic functions, both
        with the same input features. The first component represents the probability of a pair to be a
        false positive, the second represents the probability to test positive for a real interaction.
        This second component is constrained by data from testing PPIs found in Y2H which have
        additional independent literature evidence. The confidence score is calculated as the first
        component, scaled to an estimate of the overall precision of the dataset, obtained using the
        procedure described in Venkatesan et al Nature Methods 2009. The six features of a PPI used are:
        the number of screens in which it was detected; the number of different versions of the Y2H
        assay in which it was detected; the strength of growth of the yeast; whether the interaction
        between proteins X and Y was detected with both combinations of DNA-binding domain (DB) and
        activation domain (AD) fusions, i.e. DB-X with AD-Y and DB-Y with AD-X; the number of
        interaction partners of the two proteins; and the length of the ORF.
      </p>

      <h3 style={h3Style}>Interaction status</h3>
      <p style={pStyle}>
        The results can also be restricted to either only show PPIs from CCSB or from the literature.
        The user can choose to display tissue expression levels and levels of tissue specific expression
        of nodes in the network in combination with the selection of a tissue (see below).
      </p>

      <h3 style={h3Style}>Tissue expression</h3>
      <p style={pStyle}>
        One or multiple tissues can be selected to filter the protein interaction data for proteins that
        are expressed in at least one of the selected tissues. Only interactions between the expressed
        proteins will be displayed. By default, expression abundance levels will be represented on the
        network by increasing the node size. Specificity of expression is indicated by varying the
        intensity of the color of the nodes (only applicable to cases where a single tissue has been
        selected). The tissue gene expression data has been extracted from the GTEx portal and has been
        processed and normalized as described in Paulson et al BMC Bioinformatics 2017. The preferential
        expression of a given gene in a given tissue was calculated as described in Sonawane et al Cell
        Reports 2017. More details are also provided in the HuRI paper.
      </p>

      {/* ── Export options ── */}
      <h2 style={h2Style}>Export options</h2>
      <p style={pStyle}>
        The network can be exported to Cytoscape by clicking the little orange network icon in the
        bottom left corner of the network browser, if Cytoscape is installed and running. The proteins
        displayed in the network can directly be exported as list into a variety of external resources to
        calculate functional enrichments and perform other network-related searches.
      </p>

      {/* ── Save options ── */}
      <h2 style={h2Style}>Save options</h2>
      <p style={pStyle}>
        The search results can be saved as image (if a network was displayed) or in various text file
        formats as lists of proteins and interactions. Furthermore, the web portal offers to users the
        possibility to create an account. If the user is logged in, an extra Save button will appear on
        the results page allowing the user to save the search result and the exact network representation
        or session that the user generated. Later, the user can select a saved network/session and reload
        it into the network browser for further manipulation. Of note, users need to login first prior to
        performing a search or the search results will be lost.
      </p>

      {/* ── Requirements ── */}
      <h2 style={h2Style}>Requirements to run the HuRI portal</h2>
      <p style={pStyle}>
        The web browser must be configured to accept cookies and JavaScript must be enabled.
      </p>

      {/* ── Acknowledgments ── */}
      <h2 style={h2Style}>Acknowledgments</h2>
      <p style={pStyle}>
        CCSB interactome mapping and ORFeome cloning efforts are supported by federal grants from the
        National Human Genome Research Institute of NIH, the Ellison Foundation, the Dana-Farber Cancer
        Institute Strategic Initiative, the Canada Excellence Research Chairs program, and the Canadian
        Institutes of Health Research.
      </p>

      {/* ── Footer metadata ── */}
      {(settings?.version || settings?.url) && (
        <div style={{ marginTop: 48, paddingTop: 20, borderTop: '1px solid var(--border)', fontSize: 12, color: 'var(--text-soft)' }}>
          {settings.version && <span>Version {settings.version}</span>}
          {settings.version && settings.url && <span> · </span>}
          {settings.url && (
            <ExternalLink href={settings.url}>{settings.url}</ExternalLink>
          )}
        </div>
      )}
    </div>
  )
}
