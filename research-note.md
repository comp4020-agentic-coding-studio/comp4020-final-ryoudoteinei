# Useful autonomy depends on the quality of feedback

Agentic development should be judged by its feedback loops rather than the number of decisions made without intervention. My position is that autonomy becomes useful when actions produce interpretable evidence and failures constrain subsequent work. Three software-repair studies support this position while showing why simpler systems do not always win.

## Interfaces are part of the reasoning environment

[Yang et al. (2024), SWE-agent](https://arxiv.org/html/2405.15793v3), treats the agent-computer interface as a design problem. Their system provides specialised ways to navigate repositories, edit files and execute programs. The important contribution for development practice is the demonstration that an agent's environment shapes its ability to use its model capabilities. A model does not encounter a repository directly: it encounters selected observations, command results and editing affordances. Improving those can change behaviour without merely substituting a larger model.

This supports investing in the harness around an agent. Clear failure messages, bounded observations and executable checks make a proposed action easier to evaluate and correct. However, the paper studies particular repair benchmarks and configurations. It does not establish that its interface is optimal for every repository, or that successful issue resolution measures product usefulness. I therefore read the result as evidence for designing the interaction environment, not as a prescription to adopt one tool configuration unchanged.

## A counter-case to unrestricted agency

[Xia et al. (2024), Agentless](https://arxiv.org/html/2407.01489v2), presents a deliberately structured alternative: localisation, repair and patch validation, without an open-ended agent choosing its own sequence of tools. Its results challenge the assumption that more elaborate autonomous loops necessarily produce better repairs. The paper also analyses problematic benchmark issues, including misleading descriptions and cases containing the target patch. This makes the quality of the task and its evaluation part of the explanation, rather than attributing every result to the agent architecture.

The studies should not be compared by lifting their headline success rates into a league table: benchmark variants, models and evaluation conditions matter. Their productive tension is architectural. SWE-agent shows how a carefully designed interface can enable exploratory work; Agentless shows that a constrained workflow can be a strong alternative. My inference is that developers should justify where exploration is necessary. A well-localised change with a clear failure condition may benefit from a narrow pipeline; an unfamiliar repository may require navigation and iterative experiments.

The strongest objection is that fixed workflows can miss discoveries that an autonomous agent would make. That objection is valid. The answer is not to remove exploration, but to bound it with observable checkpoints. Autonomy can vary across stages: broad investigation, a concrete proposed change, then independent execution checks. The relevant question becomes whether each additional degree of freedom helps resolve uncertainty that actually exists in the task.

## Tests are evidence with a boundary

[Anthropic's Building effective agents (2024)](https://www.anthropic.com/research/building-effective-agents) offers a practitioner counterpart: predefined workflows and model-directed agents serve different needs, and complexity should earn its place through measured improvement. This agrees with choosing autonomy by task uncertainty. However, customer experience reported by a model vendor is not a controlled comparison. I treat it as actionable design guidance to test against a particular workload, rather than independent evidence of superiority.

[Jimenez et al. (2024), SWE-bench](https://arxiv.org/html/2310.06770v3), grounds evaluation in repository-level issues and executable tests, moving beyond isolated function generation. That is a substantial improvement in ecological relevance, but issue repair still has a defined task and a test-based resolution criterion. It cannot establish whether a new application deserves to exist, whether an interface is understandable, or whether people enjoy using it.

Consequently, a green build should support a specific claim, not stand for general quality. In a multi-user auction, a test can establish that concurrent bids do not overspend a wallet. It cannot establish that the auction creates interesting social choices. Technical evaluation and human judgement need different methods, and neither should borrow the authority of the other.

## A practice of accountable autonomy

These sources favour a practice in which developers define the decision boundary, provide informative observations, and retain responsibility for acceptance criteria. Corrections should persist as tests, documented constraints or revised interfaces, so that the next agent run inherits more than another request to try harder.

The resulting standard is demanding but practical: an agent's output is acceptable when the evidence matches the promises being made. Tool freedom is valuable when it helps produce that match. Where the evidence remains weak, greater autonomy should not be mistaken for greater assurance.
